import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zip, type AsyncZipOptions } from "fflate";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { s3 } from "@/lib/s3";
import { consumeCredits, restoreCredits } from "@/lib/usage";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { CODE_AGENT_FUNCTION_EVENT } from "@/inngest/functions/code-agent-function";
import { GEN_PROJ_FUN_EVENT } from "@/inngest/functions/gen-proj-name-fun";
import { type Files } from "@/types";

const B2_BUCKET = env.B2_BUCKET_NAME;

/**
 * Read a B2 GetObject response `Body` into a Uint8Array. Uses the SDK's
 * stream-mixin helper when present; falls back to manual draining of the raw
 * Node ReadableStream so a missing mixin never throws.
 */
const streamToBytes = async (
  body: NonNullable<GetObjectCommandOutput["Body"]>,
): Promise<Uint8Array> => {
  const typed = body as { transformToByteArray?: () => Promise<Uint8Array> };
  if (typeof typed.transformToByteArray === "function") {
    return typed.transformToByteArray();
  }

  // Fallback: drain the raw stream if the SDK stream-mixin is absent.
  const chunks: Buffer[] = [];
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/**
 * Read the `latest` marker object and return the revision ID stored in it.
 * Returns null when no completed revision exists yet.
 */
const resolveLatestRevision = async (
  projectId: string,
): Promise<string | null> => {
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: `projects/${projectId}/latest`,
      }),
    );
    if (!result.Body) return null;
    const bytes = await streamToBytes(result.Body);
    return new TextDecoder().decode(bytes).trim() || null;
  } catch (err) {
    // A missing marker means no completed revision exists yet. Any other
    // failure is an infrastructure problem and must not be silently
    // downgraded to the stale DB-fragment fallback.
    const name = (err as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
};

/**
 * List every real object under a completed revision prefix in B2, excluding
 * the generated `project.zip` itself so it's never nested inside another zip.
 * Handles >1000-object prefixes via pagination.
 */
const listB2ProjectFiles = async (
  projectId: string,
  revisionId: string,
): Promise<{ key: string; rel: string }[]> => {
  const prefix = `projects/${projectId}/revisions/${revisionId}/`;
  const files: { key: string; rel: string }[] = [];

  let continuationToken: string | undefined;

  do {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: B2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of result.Contents ?? []) {
      if (!object.Key) continue;

      // Never include the generated ZIP inside another ZIP.
      if (object.Key === `${prefix}project.zip`) continue;

      files.push({
        key: object.Key,
        rel: object.Key.slice(prefix.length),
      });
    }

    continuationToken = result.IsTruncated
      ? result.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return files;
};

// Maximum number of source files allowed in a single export archive.
// Prevents list pagination from growing the in-memory file table unbounded.
const MAX_EXPORT_FILES = 2_000;

// Maximum total uncompressed bytes accepted before the export is aborted.
// 256 MB is well above any realistic generated Next.js project.
const MAX_EXPORT_BYTES = 256 * 1024 * 1024;

// Number of concurrent S3 GetObject requests when downloading revision files.
const DOWNLOAD_CONCURRENCY = 8;

/**
 * Promise wrapper around fflate's callback-based `zip()`. Deflation is
 * offloaded to a worker thread (AsyncZipDeflate) for each file by passing
 * `[bytes, { level: 6 }]` tuples, which fflate automatically compresses
 * asynchronously, so the event loop is not blocked during compression.
 */
const zipAsync = (input: Record<string, Uint8Array>): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    // Wrap each entry as [bytes, options] so fflate uses AsyncZipDeflate
    // internally for off-thread deflation.
    const asyncInput: Record<string, [Uint8Array, AsyncZipOptions]> = {};
    for (const [name, bytes] of Object.entries(input)) {
      asyncInput[name] = [bytes, { level: 6 }];
    }
    zip(asyncInput, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

/**
 * Download `items` concurrently with at most `limit` requests in flight,
 * collecting { rel, bytes } pairs. Items whose Body is missing are skipped.
 */
const downloadWithConcurrency = async (
  items: { key: string; rel: string }[],
  limit: number,
  maxBytes: number,
): Promise<{ rel: string; bytes: Uint8Array }[]> => {
  const results: ({ rel: string; bytes: Uint8Array } | null)[] = new Array(
    items.length,
  ).fill(null);
  let index = 0;
  let totalBytes = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const current = index++;
        const { key, rel } = items[current];
        const object = await s3.send(
          new GetObjectCommand({ Bucket: B2_BUCKET, Key: key }),
        );
        if (!object.Body) continue;
        const bytes = await streamToBytes(object.Body);
        totalBytes += bytes.byteLength;
        if (totalBytes > maxBytes) {
          throw new Error(
            `Revision uncompressed size exceeds the export limit of ${maxBytes} bytes.`,
          );
        }
        results[current] = { rel, bytes };
      }
    },
  );

  await Promise.all(workers);
  return results.filter(
    (r): r is { rel: string; bytes: Uint8Array } => r !== null,
  );
};

export const projectRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found with ID: ${input.id}`,
        });
      }

      return project;
    }),

  getExport: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
        // When provided, export the exact fragment the user selected instead
        // of always the project's latest revision.
        fragmentId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await db.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
        select: { id: true, name: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found with ID: ${input.id}`,
        });
      }

      // When a specific fragment was requested, resolve it up front (and
      // verify it actually belongs to this project) so both the B2 path and
      // the DB fallback below export that exact fragment, not the latest.
      let targetFragment: {
        revisionId: string | null;
        files: Files;
      } | null = null;

      if (input.fragmentId) {
        const fragment = await db.fragment.findUnique({
          where: { id: input.fragmentId },
          select: {
            revisionId: true,
            files: true,
            message: { select: { projectId: true } },
          },
        });

        if (!fragment || fragment.message.projectId !== project.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fragment not found for this project.",
          });
        }

        targetFragment = {
          revisionId: fragment.revisionId,
          files: fragment.files as Files,
        };
      }

      // B2 is the source of truth. Resolve either the requested fragment's
      // own revision, or (when no fragment was specified) the latest
      // completed revision via the `latest` marker written atomically after
      // every successful upload. The archive is rebuilt from only that
      // revision's files so removed or renamed files from other runs are
      // never included. Each step is guarded so an S3 failure degrades to
      // the DB-fragment fallback instead of a raw 500.
      try {
        const revisionId = targetFragment
          ? targetFragment.revisionId
          : await resolveLatestRevision(project.id);

        if (revisionId) {
          const zipKey = `projects/${project.id}/revisions/${revisionId}/project.zip`;
          const b2files = await listB2ProjectFiles(project.id, revisionId);

          if (b2files.length > 0) {
            // Reject oversized revisions before downloading anything so a
            // pathological project can't exhaust server memory.
            if (b2files.length > MAX_EXPORT_FILES) {
              throw new Error(
                `Revision has ${b2files.length} files, which exceeds the export limit of ${MAX_EXPORT_FILES}.`,
              );
            }

            // Download all revision files concurrently (bounded to
            // DOWNLOAD_CONCURRENCY in-flight requests at a time). The total
            // uncompressed size cap is enforced during download itself, so
            // memory usage is bounded before all bytes are resident.
            const downloaded = await downloadWithConcurrency(
              b2files,
              DOWNLOAD_CONCURRENCY,
              MAX_EXPORT_BYTES,
            );

            // Build the zip asynchronously so deflation is offloaded to a
            // worker thread and the event loop remains unblocked.
            const zipInput: Record<string, Uint8Array> = {};
            for (const { rel, bytes } of downloaded) {
              zipInput[rel] = bytes;
            }
            const zipped = await zipAsync(zipInput);

            await s3.send(
              new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: zipKey,
                Body: zipped,
                ContentType: "application/zip",
              }),
            );

            const url = await getSignedUrl(
              s3,
              new GetObjectCommand({
                Bucket: B2_BUCKET,
                Key: zipKey,
                // Instruct B2 to return the object as a download with the right
                // filename/content-type. These are inlined into the presigned URL
                // as query params, so the browser downloads on navigation without
                // us ever fetching the bytes.
                ResponseContentType: "application/zip",
                ResponseContentDisposition: `attachment; filename="${project.name}.zip"`,
              }),
              { expiresIn: 300 },
            );

            return { mode: "url" as const, url, name: project.name };
          }
        }
      } catch (err) {
        console.error(
          `projects.getExport: B2 archive reconstruction failed for project ${project.id}:`,
          err,
        );
      }

      // Fallback for projects created before B2 storage was implemented, or
      // when the resolved revision had no files in B2. If a specific
      // fragment was requested, its own files are the fallback source;
      // otherwise fall back to the last assistant fragment for the project.
      const fallbackFiles = targetFragment
        ? targetFragment.files
        : await (async () => {
            const messages = await db.message.findMany({
              where: { projectId: project.id },
              orderBy: { createdAt: "asc" },
              select: {
                role: true,
                fragment: {
                  select: { files: true },
                },
              },
            });

            const lastFragment = messages
              .filter((m) => m.role === "ASSISTANT" && m.fragment)
              .at(-1)?.fragment;

            return lastFragment?.files as Files | undefined;
          })();

      if (!fallbackFiles) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Project files aren't ready yet. Please wait for the project to finish generating.",
        });
      }

      return {
        mode: "zip" as const,
        files: fallbackFiles,
        name: project.name,
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        order: z.enum(["asc", "desc"]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, order } = input;

      const [projects, totalCount] = await Promise.all([
        db.project.findMany({
          where: {
            userId: ctx.auth.userId,
          },
          orderBy: { createdAt: order },
          take: limit,
          skip: (page - 1) * limit,
        }),
        db.project.count({
          where: {
            userId: ctx.auth.userId,
          },
        }),
      ]);

      return {
        items: projects,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Scope the delete by userId so users can only remove their own projects.
      const result = await db.project.deleteMany({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found with ID: ${input.id}`,
        });
      }

      return { success: true };
    }),

  create: protectedProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(1, { error: "Prompt is required!" })
          .max(10000, { error: "Prompt is too long!" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      /**
       * Consume credits
       * Validate user credits before create the project/vibe
       **/
      try {
        await consumeCredits();
      } catch (error: unknown) {
        // RateLimiterRes (rate limit exceeded) is not an Error instance.
        // Any other error (DB failure, auth, etc.) is an Error subclass.
        if (error instanceof Error) {
          console.error("projects.create: consumeCredits failed:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Something went wrong...",
          });
        } else {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have run out of credits",
          });
        }
      }

      try {
        /** create project with message **/
        const newProject = await db.project.create({
          data: {
            name: "Unknown Project",
            userId: ctx.auth.userId,

            messages: {
              create: {
                content: input.prompt,
                role: "USER",
                type: "RESULT",
              },
            },
          },
          // The nested-created prompt message's id/createdAt are needed for
          // the code-agent event payload; a brand-new project has exactly
          // one message. The caller only consumes `data.id`, so widening the
          // return with the relation is safe.
          include: {
            messages: true,
          },
        });

        /** Triger project name generator job **/
        await inngest.send({
          name: GEN_PROJ_FUN_EVENT,
          data: {
            prompt: input.prompt,
            projectId: newProject.id,
          },
        });

        /** Triger code agent background job **/
        await inngest.send({
          name: CODE_AGENT_FUNCTION_EVENT,
          data: {
            prompt: input.prompt,
            projectId: newProject.id,
            messageId: newProject.messages[0].id,
            messageCreatedAt: newProject.messages[0].createdAt.toISOString(),
          },
        });

        return newProject;
      } catch (error) {
        // Post-charge work failed before the job was accepted: give the
        // consumed credit back so it isn't lost, then surface the original
        // error. A restore failure must not mask the real cause.
        await restoreCredits().catch((err) => {
          console.error("projects.create: restoreCredits failed:", err);
        });
        throw error;
      }
    }),
});
