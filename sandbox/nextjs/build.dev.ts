import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

console.log("cwd:", process.cwd());
console.log("dotenv loaded:", process.env.E2B_API_KEY ? "YES" : "NO");

import { Template, defaultBuildLogger } from "e2b";
import { template } from "./template";

async function main() {
  await Template.build(template, "vibe-nextjs-test-4", {
    onBuildLogs: defaultBuildLogger(),
    skipCache: true,
  });
}

main().catch(console.error);
