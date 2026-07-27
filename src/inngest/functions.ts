import { inngest } from "./client";
import { openai, createAgent } from "@inngest/agent-kit";

export const processTask = inngest.createFunction(
  {
    id: "process-task",
    triggers: { event: "app/task.created" },
  },
  async ({ event }) => {
    const summarizer = createAgent({
      name: "Summarizer",
      system: "You are an expert summarizer, Do summarize in short.",
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output } = await summarizer.run(
      `Summarize the following text: ${event.data.text}`,
    );

    console.log(output);
    
    return { data: output };
  },
);
