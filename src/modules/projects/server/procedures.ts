import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zipSync } from "fflate";

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
 * List every real object under `projects/<projectId>/` in B2, excluding the
 * generated `project.zip` itself so it's never nested inside another zip.
 * Handles >1000-object prefixes via pagination.
 */
const listB2ProjectFiles = async (
  projectId: string,
): Promise<{ key: string; rel: string }[]> => {
  const prefix = `projects/${projectId}/`;
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

      const zipKey = `projects/${project.id}/project.zip`;

      // B2 is the source of truth. Rebuild the complete archive on-demand from
      // the stored objects (always fresh); cache it as project.zip so later
      // exports can just presign it. Each step is guarded so an S3 failure
      // degrades to the DB-fragment fallback instead of a raw 500.
      try {
        const b2files = await listB2ProjectFiles(project.id);

        if (b2files.length > 0) {
          const zipInput: Record<string, Uint8Array> = {};

          for (const { key, rel } of b2files) {
            const object = await s3.send(
              new GetObjectCommand({ Bucket: B2_BUCKET, Key: key }),
            );

            if (!object.Body) continue;

            zipInput[rel] = await streamToBytes(object.Body);
          }

          const zip = zipSync(zipInput);

          await s3.send(
            new PutObjectCommand({
              Bucket: B2_BUCKET,
              Key: zipKey,
              Body: zip,
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
      } catch (err) {
        console.error(
          `projects.getExport: B2 archive reconstruction failed for project ${project.id}:`,
          err,
        );
      }

      // Fallback for projects created before B2 storage was implemented.
      const messages = await db.message.findMany({
        where: { projectId: project.id },
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

      if (!lastFragment?.files) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Project files aren't ready yet. Please wait for the project to finish generating.",
        });
      }

      return {
        mode: "zip" as const,
        files: lastFragment.files as Files,
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
