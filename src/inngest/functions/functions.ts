import { Sandbox } from "@e2b/code-interpreter";
import { inngest } from "../client";
import { openai, createAgent } from "@inngest/agent-kit";
import { getSandbox } from "../utils";

export const processTask = inngest.createFunction(
  {
    id: "process-task",
    triggers: { event: "app/task.created" },
  },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        "tests-default-team-30d4/vibe-nextjs-test-4",
      );
      return sandbox.sandboxId;
    });

    const summarizer = createAgent({
      name: "Summarizer",
      system: "You are an expert summarizer, Do summarize in short.",
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output } = await summarizer.run(
      `Summarize the following text: ${event.data.text}`,
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sbx = await getSandbox(sandboxId);
      const host = sbx.getHost(3000);
      return `https://${host}`
    });

    return { data: output, sandboxUrl };
  },
);
