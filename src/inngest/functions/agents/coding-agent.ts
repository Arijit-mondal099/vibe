import { createAgent, openai } from "@inngest/agent-kit";

import { terminalTool } from "../tools/terminal/tool";
import { createOrUpdateFiles } from "../tools/create-or-update-files/tool";
import { readFiles } from "../tools/read/tool";
import { webSearch } from "../tools/web-search/tool";
import { PROMPT } from "../prompts/build-prompt";
import { lastAssistantTextMessageContent } from "@/inngest/utils";

export interface AgentState {
  summary: string,
  files: { [path: string]: string }
}

export const createCodingAgent = (sandboxId: string) => {
  return createAgent<AgentState>({
    name: "coding-agent",
    description: "An expert coding agent.",
    system: PROMPT,
    model: openai({
      model: "gpt-4.1",
      defaultParameters: {
        temperature: 0.1,
      },
    }),
    tools: [
      terminalTool(sandboxId),
      createOrUpdateFiles(sandboxId),
      readFiles(sandboxId),
      webSearch(),
    ],
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const lastAssistantText = lastAssistantTextMessageContent(result);

        if (lastAssistantText && network) {
          if (lastAssistantText.includes("<task_summary>")) {
            network.state.data.summary = lastAssistantText;
          }
        }

        return result;
      },
    },
  });
};
