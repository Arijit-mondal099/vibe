import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

import { getSandbox } from "@/inngest/utils";
import { validatePath, truncate, MAX_FILES_PER_CALL, Content, FileError, ReadResult } from "./helpers";

/**
 * Agent tool: read one or more files from the sandbox project directory.
 *
 * Flow:
 *  1. Validate each path against blocked patterns (secrets, git internals, etc.)
 *  2. Connect to the running E2B sandbox
 *  3. Attempt to read each file individually — failures are collected per-file,
 *     not as a batch error
 *  4. Return JSON with `files` (path + content) and `errors` (path + reason)
 *
 * Content is truncated to 10k chars per file (tail-kept) to avoid overwhelming
 * the model with large outputs.
 */
export const readFiles = (sandboxId: string) => {
  return createTool({
    name: "read-files",

    description:
      "Read one or more files from the sandbox project directory. " +
      "Returns a JSON object with `files` (array of { path, content }) and " +
      "`errors` (array of { path, error }). Content is truncated if very long. " +
      "Blocked: .env files, lockfiles, node_modules, .git internals, " +
      "absolute paths, and path traversal.",

    parameters: z.object({
      files: z.array(z.string()),
    }),

    handler: async ({ files }, { step }) => {
      return await step?.run("read-files", async () => {
        // Reject oversized batches before doing any work
        if (files.length > MAX_FILES_PER_CALL) {
          return JSON.stringify({
            files: [],
            errors: [{ path: "*", error: `Too many files requested (max ${MAX_FILES_PER_CALL})` }],
          } satisfies ReadResult);
        }

        // Validate all paths first — reject blocked paths before connecting
        const validated = files.map((f) => ({ path: f, ...validatePath(f) }));
        const blocked = validated.filter((v) => !v.valid);

        const sandbox = await getSandbox(sandboxId);

        const contents: Content[] = [];
        const errors: FileError[] = [];

        // Collect blocked-path rejections
        for (const b of blocked) {
          errors.push({ path: b.path, error: b.reason ?? "unknown" });
        }

        // Attempt each valid file individually
        const validPaths = validated.filter((v) => v.valid).map((v) => v.path);
        for (const file of validPaths) {
          try {
            const content = await sandbox.files.read(file);
            contents.push({ path: file, content: truncate(content) });
          } catch (error: unknown) {
            errors.push({ path: file, error: `${error}` });
          }
        }

        return JSON.stringify({ files: contents, errors } satisfies ReadResult);
      });
    },
  });
};
