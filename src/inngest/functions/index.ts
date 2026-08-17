import { codeAgentFunction } from "@/inngest/functions/code-agent-function";
import { generateProjectName } from "@/inngest/functions/gen-proj-name-fun";

export const functions = [codeAgentFunction, generateProjectName];
