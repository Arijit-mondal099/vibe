import { createAgent, openai } from "@inngest/agent-kit";

import { PROMPT } from "./prompt";

const AGENT_NAME = "vibe/fragment-title-generator" as const;
const AGENT_DESCRIPTION = "A fragment title generator" as const;

export function createFragmentTitleGeneratorAgent() {
  return createAgent({
    name: AGENT_NAME,
    description: AGENT_DESCRIPTION,
    system: PROMPT,
    model: openai({
      model: "gpt-4o-mini",
    }),
  });
}
