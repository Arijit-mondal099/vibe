import { createAgent, openai } from "@inngest/agent-kit";

import { inngest } from "@/inngest/client";
import { parseAgentOutput } from "@/inngest/utils";
import { db } from "@/lib/db";

const FUNCTION_ID = "vibe/generate-project-name" as const;
const FUNCTION_NAME = "Generate Project Name" as const;
const FUNCTION_DESC = "Run generate project name agent." as const;
export const GEN_PROJ_FUN_EVENT = "generate-project-name/run" as const;

export const generateProjectName = inngest.createFunction(
  {
    id: FUNCTION_ID,
    name: FUNCTION_NAME,
    description: FUNCTION_DESC,
    triggers: { event: GEN_PROJ_FUN_EVENT },
  },
  async ({ event, step }) => {
    const agent = createAgent({
      name: "generate-project-name",
      system: `
You are an assistant that generates a short, descriptive name for a project/vibe based on user prompt/message.
The name should be:
  - Relevant to what user want to build
  - Max 4 words
  - Written in name case (e.g., "Todo App", "E-Commerce app")
  - No punctuation, quotes, or prefixes`,
      model: openai({
        model: "gpt-4o-mini",
      }),
    });

    const { output } = await agent.run(event.data.prompt);
    const projectName = parseAgentOutput(output);

    await step.run("save-to-db", async () => {
      await db.project.update({
        where: { id: event.data.projectId },
        data: { name: projectName },
      });

      return "project-name-updated";
    });

    return {
      success: true,
      name: projectName,
    };
  },
);
