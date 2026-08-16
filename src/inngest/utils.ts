import { env } from "@/lib/env";
import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, Message, TextMessage } from "@inngest/agent-kit";

export const TEMPLATE = env.VIBE_TEMPLATE;
export const SANDBOX_TIMEOUT_MS = 3_600_000 as const; // 1 hours
export const MAX_ITER = 15 as const;

/**
 * Create a sandbox and return the ID of sandbox
 * @returns sandbox id
 */
export const getSandboxId = async () => {
  const sbx = await Sandbox.create(TEMPLATE, { timeoutMs: SANDBOX_TIMEOUT_MS });
  return sbx.sandboxId;
};

/**
 * @param sbxId sandbox id to get sandbox
 * @returns sandbox
 */
export const getSandbox = async (sbxId: string) => {
  return await Sandbox.connect(sbxId);
};

/**
 * Return last response by assistant
 */
export const lastAssistantTextMessageContent = (result: AgentResult) => {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message?.content
      : message.content.map((c) => c.text).join(" ")
    : undefined;
};

/**
 * A utility function for parse agent response
 * @param value Agent response
 * @returns string
 */
export const parseAgentOutput = (value: Message[]): string => {
  const output = value[0];

  // Agent may return no output (e.g. blank); don't index into undefined.
  if (!output || output.type !== "text") {
    return "Fragment";
  }

  if (Array.isArray(output.content)) {
    return output.content.map((part) => part.text).join("");
  } else {
    return output.content;
  }
};
