import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";

import { getSandbox } from "@/inngest/utils";
import { validatePath } from "./helpers";
import { AgentState } from "../../../../agents/coding-agent";

/**
 * Agent tool: write one or more files into the sandbox project directory.
 *
 * Each file is:
 *  1. Validated against BLOCKED_PATH_PATTERNS
 *  2. Written via the E2B filesystem API (parent dirs auto-created)
 *  3. Tracked in network state so subsequent calls know what exists
 *
 * On any validation failure, no files are written and the error is returned.
 * On write failure, the error is caught and returned — previous writes in the
 * same batch are NOT rolled back.
 */
export const createOrUpdateFiles = (sandboxId: string) => {
  return createTool({
    name: "create-or-update-files",

    description:
      "Create or update multiple files in the sandbox project directory. " +
      "Accepts an array of { path, content } objects. Use this for writing " +
      "source code, configs, and other project files — prefer this over " +
      "echo/redirect in the terminal tool for multi-line content. " +
      "Blocked: .env files, lockfiles, node_modules, .git internals, " +
      "absolute paths, and path traversal.",

    parameters: z.object({
      files: z.array(
        z.object({
          path: z.string(),
          content: z.string(),
        }),
      ),
    }),

    handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
      const result = await step?.run("create-or-update-files", async () => {
        try {
          // Load existing file registry from network state, or start fresh
          const updatedFiles = (await network.state.data.files) || {};
          const sandbox = await getSandbox(sandboxId);

          for (const file of files) {
            // Reject disallowed paths before touching the sandbox
            const check = validatePath(file.path);
            if (!check.valid) {
              return {
                success: false as const,
                error: `Rejected ${file.path}: ${check.reason}`,
              };
            }
            // Write file — SDK creates parent dirs automatically
            await sandbox.files.write(file.path, file.content);
            // Track in registry for later reads / agent awareness
            updatedFiles[file.path] = file.content;
          }

          return { success: true as const, files: updatedFiles };
        } catch (error: unknown) {
          return { success: false as const, error: `${error}` };
        }
      });

      if (result?.success) {
        // Persist updated file registry back to network state
        network.state.data.files = result.files;
        return `Files written: ${files.map((f) => f.path).join(", ")}`;
      }

      return `Error creating/updating files: ${result?.error}`;
    },
  });
};
