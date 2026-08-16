import { createAgent, openai } from "@inngest/agent-kit";

import { terminalTool } from "@/tools/terminal";
import { createOrUpdateFiles } from "@/tools/create-or-update-files";
import { readFiles } from "@/tools/read";
import { webSearch } from "@/tools/web-search";

import { lastAssistantTextMessageContent } from "@/inngest/utils";
import { PROMPT } from "./prompt";
import { Files } from "@/types";

export interface AgentState {
  summary: string;
  files: Files;
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
