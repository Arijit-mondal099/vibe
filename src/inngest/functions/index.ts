import { codeAgentFunction } from "@/inngest/functions/code-agent-function";
import { generateProjectName } from "@/inngest/functions/gen-proj-name-fun";
import { uploadProjectToS3 } from "@/inngest/functions/upload-project-to-s3";

export const functions = [codeAgentFunction, generateProjectName, uploadProjectToS3];
