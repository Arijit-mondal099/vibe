import { createAgent, openai } from "@inngest/agent-kit";

import { PROMPT } from "./prompt";

const AGENT_NAME = "vibe/response-generator" as const;
const AGENT_DESCRIPTION = "A response generator agent" as const;

export function createResponseGeneratorAgent() {
  return createAgent({
    name: AGENT_NAME,
    description: AGENT_DESCRIPTION,
    system: PROMPT,
    model: openai({
      model: "gpt-4o-mini",
    }),
  });
}
