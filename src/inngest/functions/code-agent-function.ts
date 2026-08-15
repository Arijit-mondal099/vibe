import { createNetwork, createState, type Message } from "@inngest/agent-kit";

import { AgentState, createCodingAgent } from "@/agents/code-agent";
import { createFragmentTitleGeneratorAgent } from "@/agents/fragment-title-generator";
import { createResponseGeneratorAgent } from "@/agents/response-generator";

import { db } from "@/lib/db";
import { inngest } from "../client";
import { getSandbox, getSandboxId, parseAgentOutput, MAX_ITER } from "../utils";

const CODE_AGENT_FUNCTION_ID = "vibe/code-agent" as const;
const CODE_AGENT_FUNCTION_NAME = "Vibe Code Agent Function" as const;
const CODE_AGENT_FUNCTION_DESC =
  "Runs a coding agent that builds nextjs applications using shadcn/ui components in a sandboxed environment." as const;
export const CODE_AGENT_FUNCTION_EVENT = "code-agent/run" as const;

/**
 * Inngest agent background workflow function
 */
export const codeAgentFunction = inngest.createFunction(
  {
    id: CODE_AGENT_FUNCTION_ID,
    name: CODE_AGENT_FUNCTION_NAME,
    description: CODE_AGENT_FUNCTION_DESC,
    triggers: { event: CODE_AGENT_FUNCTION_EVENT },
  },
  async ({ event, step }) => {
    /**
     * Create sandbox and get sandbox id
     */
    const sandboxId = await step.run("get-sandbox-id", async () => {
      return await getSandboxId();
    });

    /**
     * Build agent memory/context
     */
    const messages = await step.run(
      `get-messages-${event.data.projectId}`,
      async () => {
        const formatedMessages: Message[] = [];

        const messages = await db.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // The last message is the current-turn prompt (saved by the tRPC
        // mutation right before this event fired). It's passed separately
        // as the input to network.run() below, so exclude it here —
        // otherwise the model sees it twice: once in history, once as input.
        const historyMessages = messages.slice(0, -1);

        for (const message of historyMessages) {
          formatedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content.trim(),
          });
        }

        return formatedMessages;
      },
    );

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages,
      },
    );

    /**
     * Create coding agent
     * and coding agent network
     */
    const codingAgent = createCodingAgent(sandboxId);

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codingAgent],
      maxIter: MAX_ITER,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data?.summary;
        if (summary) return;
        return codingAgent;
      },
    });

    /**
     * Run coding agent via network
     */
    const result = await network.run(event.data.prompt, { state });

    /**
     * fragment title generator
     * and response generator agent
     */
    const fragmentTitleGenerator = createFragmentTitleGeneratorAgent();
    const responseGenerator = createResponseGeneratorAgent();

    const { output: title } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );
    const { output: response } = await responseGenerator.run(
      result.state.data.summary,
    );

    /**
     * Get sandbox url to see live view
     */
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      try {
        const sbx = await getSandbox(sandboxId);
        return `https://${sbx.getHost(3000)}`;
      } catch {
        return "unavailable";
      }
    });

    /**
     * Save the agent response to the db
     */
    const isError =
      !result.state.data?.summary ||
      Object.keys(result.state.data?.files || {}).length === 0;

    await step.run("save-to-db", async () => {
      if (isError) {
        return await db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(response),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandBoxUrl: sandboxUrl,
              files: result.state.data.files,
              title: parseAgentOutput(title),
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
