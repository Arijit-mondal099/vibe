import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

import { BLOCKED_PATTERNS, TIMEOUT_MS, truncate } from "./helpers";
import { getSandbox } from "@/inngest/utils";

/**
 * Agent tool: execute a shell command inside the sandbox.
 *
 * Flow:
 *  1. Reject if command matches a blocked pattern (destructive, privileged, dev-server, etc.)
 *  2. Connect to the running E2B sandbox
 *  3. Run the command with a 3min timeout, streaming stdout/stderr into buffers
 *  4. Return combined output, truncated to the last MAX_OUTPUT_CHARS chars
 *
 * Dev-server commands (npm run dev, next dev/start) are blocked because the
 * sandbox already runs Next.js via its start command — attempting another would
 * hang until timeout.
 */
export const terminalTool = (sandboxId: string) => {
  return createTool({
    name: "terminal",

    description:
      "Runs a shell command in the user's sandboxed project directory (e.g. npm install, " +
      "npm run build, ls, cat). Returns stdout/stderr as a string, truncated if very long. " +
      "\`npm run dev\`, \`next dev\`, and \`next start\` are blocked — the dev server is " +
      "already running in this sandbox. " +
      "Destructive or dangerous commands (rm -rf /, sudo, " +
      "chmod -R 777, piping curl to a shell, etc.) are rejected before execution.",

    parameters: z.object({ command: z.string() }),

    handler: async ({ command }, { step }) => {
      return await step?.run("terminal", async () => {
        // Check blocked patterns before connecting to the sandbox
        const blocked = BLOCKED_PATTERNS.find((r) => r.pattern.test(command));
        if (blocked) {
          return `Command rejected: ${blocked.reason}. This command is not permitted in this environment.`;
        }

        const sandbox = await getSandbox(sandboxId);

        // Accumulate output while the command runs (streaming)
        const buffers = { stdout: "", stderr: "" };
        try {
          const result = await sandbox.commands.run(command, {
            timeoutMs: TIMEOUT_MS,
            onStdout: (data: string) => { buffers.stdout += data },
            onStderr: (data: string) => { buffers.stderr += data },
          });

          let output = result.stdout;
          if (result.stderr) output += `\n[stderr]: ${result.stderr}`;
          return truncate(output);
        } catch (error: unknown) {
          const errOutput = `Command failed: ${error}\nStdout: ${buffers.stdout}\nStderr: ${buffers.stderr}`;
          console.error(errOutput);
          return truncate(errOutput);
        }
      });
    },
  });
};
