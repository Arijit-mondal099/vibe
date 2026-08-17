import { Template, waitForURL } from "e2b";

export const template = Template()
  .fromImage("node:22-slim")
  .setUser("root")
  .setWorkdir("/")
  .runCmd("apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*")
  .copy("compile_page.sh", "/compile_page.sh")
  .runCmd("chmod +x /compile_page.sh")
  .setWorkdir("/home/user/nextjs-app")
  .runCmd("npx --yes create-next-app@16.2.10 . --yes")
  .runCmd("npx shadcn@latest init --preset b0 --template next")
  .runCmd("npx --yes shadcn@latest add --all --yes")
  .runCmd("mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app")
  .setWorkdir("/home/user")
  .setUser("user")
  .setStartCmd("/compile_page.sh", waitForURL("http://localhost:3000"));
