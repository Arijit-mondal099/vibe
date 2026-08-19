import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "@/inngest/client";
import { env } from "@/lib/env";
import { s3 } from "@/lib/s3";
import { getSandbox } from "@/inngest/utils";

const PROJECT_ROOT = "/home/user";

// Directories pruned before descending so dependency/build/vcs trees and
// tool caches never get listed. The npm/npx cache alone holds thousands of
// files — recursing into them makes the walk (and the resulting upload) huge.
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".git",
  ".npm",
  ".bun",
  ".cache",
  ".local",
  ".config",
  ".yarn",
  ".pnpm-store",
]);

// Files that are not part of the generated app: the sandbox's user home
// dotfiles (created by useradd) and the coding-agent guidance files. Skipped
// by basename so they're excluded wherever they appear.
const IGNORED_FILES = new Set([
  ".DS_Store",
  ".bash_logout",
  ".bashrc",
  ".profile",
  "AGENTS.md",
  "CLAUDE.md",
]);

const UPLOAD_CONCURRENCY = 10;

/**
 * Collect every file under `dir`, recursing into subdirectories.
 *
 * IGNORED_DIRECTORIES are pruned at each level before descending so
 * dependency/build/vcs trees are never listed. Symlinks are not followed, so
 * they can't cause cycles.
 */
const collectProjectFiles = async (
  sandbox: Sandbox,
  dir: string,
  files: string[] = [],
): Promise<string[]> => {
  const entries = await sandbox.files.list(dir, { depth: 1 });

  for (const entry of entries) {
    if (entry.type === "dir") {
      const name = entry.path.split("/").at(-1);
      if (name && IGNORED_DIRECTORIES.has(name)) continue;
      await collectProjectFiles(sandbox, entry.path, files);
    } else if (entry.type === "file") {
      files.push(entry.path);
    }
  }

  return files;
};

/**
 * Map `items` through `mapper` with at most `limit` promises in flight.
 * Keeps the S3 uploads from running strictly one at a time (each round trip is
 * ~hundreds of ms, so serial uploads of many files take minutes).
 */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  let index = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await mapper(items[current]);
      }
    },
  );

  await Promise.all(workers);
  return results;
};

export const uploadProjectToS3 = inngest.createFunction(
  {
    id: "vibe/upload-project-to-s3",
    name: "Upload Project Source Code to S3",
    description:
      "Uploads the complete project source code from E2B to Backblaze S3.",
    triggers: {
      event: "run/upload-to-s3",
    },
  },
  async ({ event, step }) => {
    const { projectId, sandboxId } = event.data;

    const uploadedFiles = await step.run("upload-project-files", async () => {
      const sandbox = await getSandbox(sandboxId);

      const files = await collectProjectFiles(sandbox, PROJECT_ROOT);

      const toUpload = files
        .map((filePath) => {
          const relativePath = filePath
            .replace(`${PROJECT_ROOT}/`, "")
            .replaceAll("\\", "/");
          return { filePath, relativePath };
        })
        .filter(
          ({ relativePath }) =>
            !IGNORED_FILES.has(relativePath.split("/").at(-1)!),
        );

      // Read each file once as raw bytes (binary-safe for assets under
      // public/) and upload every object concurrently. A consolidated
      // project.zip is built on-demand by `projects.getExport` when needed.
      await mapWithConcurrency(
        toUpload,
        UPLOAD_CONCURRENCY,
        async ({ filePath, relativePath }) => {
          const bytes = await sandbox.files.read(filePath, { format: "bytes" });

          await s3.send(
            new PutObjectCommand({
              Bucket: env.B2_BUCKET_NAME,
              Key: `projects/${projectId}/${relativePath}`,
              Body: bytes,
            }),
          );
        },
      );

      return toUpload.length;
    });

    return {
      success: true,
      projectId,
      uploadedFiles,
    };
  },
);
