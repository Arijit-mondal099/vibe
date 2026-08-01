import { createNetwork } from "@inngest/agent-kit";
import { inngest } from "../client";
import { getSandbox, getSandboxId, MAX_ITER } from "../utils";
import { AgentState, createCodingAgent } from "./agents/coding-agent";
import { db } from "@/lib/db";

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    name: "Code Agent Function",
    description:
      "Runs a coding agent that builds nextjs applications using shadcn/ui components in a sandboxed environment.",
    triggers: { event: "code-agent/run" },
  },
  async ({ event, step }) => {
    /**
     * Create sandbox and get sandbox id
     */
    const sandboxId = await step.run("get-sandbox-id", async () => {
      return await getSandboxId();
    });

    /** Create coding agent **/
    const codingAgent = createCodingAgent(sandboxId);

    /** Create coding agent network **/
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codingAgent],
      maxIter: MAX_ITER,
      router: async ({ network }) => {
        const summary = network.state.data?.summary;
        if (summary) return;
        return codingAgent;
      },
    });

    /** Run coding agent via network **/
    const result = await network.run(event.data.prompt);

    const isError =
      !result.state.data?.summary ||
      Object.keys(result.state.data?.files || {}).length === 0;

    /** Get sandbox url to see live view **/
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      try {
        const sbx = await getSandbox(sandboxId);
        return `https://${sbx.getHost(3000)}`;
      } catch {
        return "unavailable";
      }
    });

    /** Save the agent response to the db **/
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
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandBoxUrl: sandboxUrl,
              files: result.state.data.files,
              title: "fragment",
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
