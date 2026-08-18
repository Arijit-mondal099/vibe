<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

> **Read [`CLAUDE.md`](./CLAUDE.md) alongside this file.** It defines the behavioral standards for all work here — think before coding, simplicity first, surgical changes, goal-driven execution. This file contains project-specific facts; `CLAUDE.md` contains how to work. Where they conflict, this file wins.

# Vibe

A Next.js app where a user prompt kicks off a **coding agent** (Inngest + Agent Kit) that builds a custom Next.js/shadcn app live inside an **E2B sandbox**, then reports back a summary + a shareable live-view URL that gets saved to the database.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16.2.10** (App Router, Turbopack, React 19) |
| Package manager | **Bun** (Node >= 22, pinned in `.nvmrc`) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (`@/components/ui/*`), Radix |
| API | tRPC v11 + TanStack Query + superjson |
| ORM | Prisma 7 (`prisma-client` generator → `@/generated/prisma`) + `@prisma/adapter-pg` (pooling) |
| Background jobs | Inngest + `@inngest/agent-kit` (OpenAI gpt-4.1) |
| Sandbox | E2B code-interpreter (templates `vibe-nextjs-dev` / `vibe-nextjs-prod`) |
| Validation | Zod v4 (v4 syntax: `{ error: "..." }`, NOT v3 `{ message: ... }`) |

## Agent skills (load before relevant work)

Skills live in `.claude/skills/` (vendored via `skills-lock.json`). Load the matching one with the skill tool before the task it covers:

- **shadcn** — any work touching `src/components/ui/*` or `components.json`: adding/searching/fixing/styling/composing shadcn components (incl. chat UI). Run its CLI with `bunx --bun shadcn@latest` (repo uses bun). `src/components/ui/*` is generated — don't hand-edit.
- **frontend-design** — building new UI or reshaping existing UI when the user wants distinctive, non-templated visual design (palette / typography / layout direction).
- **vercel-react-best-practices** — writing/reviewing/refactoring React/Next.js code: eliminating waterfalls, bundle size, server/client fetching, re-renders.
- **web-design-guidelines** — when asked to "review my UI", audit accessibility/UX, or check against best practices (fetches latest guidelines from the web).
- **webapp-testing** — verifying the running app with Playwright: `python .claude/skills/webapp-testing/scripts/with_server.py --server "bun run dev" --port 3000 -- python your_automation.py` (all scripts live inside the skill dir).

## Commands

```sh
bun install              # install deps (use bun, never npm/yarn/pnpm)
bun run dev              # Next.js dev server (port 3000)
bun run build            # production build
bun run lint             # eslint (runs on every commit via husky pre-commit)
bun run typecheck        # tsc --noEmit
bun run db:generate      # (re)generate Prisma client into src/generated/prisma
bun run db:push          # push schema to dev DB (no migration file)
bun run db:migrate       # create + apply a migration (interactive)
bun run db:migrate:create  # draft migration only (no apply; then db:migrate:deploy)
bun run db:migrate:deploy  # apply migrations (production)
bun run db:studio        # open Prisma Studio
bun run inngest          # Inngest dev server (local event testing)
bun run template:build:dev   # build the dev E2B sandbox template
bun run template:build:prod  # build the prod E2B sandbox template
bun run template:list        # list E2B templates
```

## Testing

No unit-test runner is configured (no test script, no vitest/jest/playwright config, no app-level test files). Verification is `bun run lint` + `bun run typecheck` (+ `bun run build`); to exercise the running UI use the **webapp-testing** skill (Playwright, driven from Python scripts).

## Environment variables

All env vars are **validated at import time** in `src/lib/env.ts` via a Zod schema; a missing required var calls `process.exit(1)` — this file is **server-only**, never import it into client components (`"use client"` files read `NEXT_PUBLIC_*` via `process.env` directly, e.g. `src/trpc/client.tsx:33`).

**Required:** `NEXT_PUBLIC_APP_URI`, `DATABASE_URL`, `OPENAI_API_KEY`, `E2B_API_KEY`, `VIBE_TEMPLATE`, `TAVILY_API_KEY`
**Optional:** `NODE_ENV` (enum: development/production/test), `INNGEST_DEV`

> **CRITICAL:** `.env*` is gitignored. CI has no `.env` — when you add a **required** env var to `env.ts`, you MUST also add a placeholder to the `build` job in `.github/workflows/ci.yml` or CI will fail. (Rationale: `env.ts` runs at import time during `next build`; `NEXT_PUBLIC_*` vars are inlined into the client bundle at build time.)

`VIBE_TEMPLATE` selects the E2B sandbox template per-environment (`.env`: `tests-default-team-30d4/vibe-nextjs-dev`; prod: `.../vibe-nextjs-prod`). There is intentionally **no code fallback** — do not add one.

## Architecture

```
src/
  app/                     # App Router: routes, api routes (/api/trpc, /api/inngest)
  proxy.ts                 # Clerk auth middleware — protects all non-public routes (Next 16 name)
  components/ui/           # shadcn/ui components (do not hand-edit; re-run shadcn add)
  generated/prisma/        # Prisma client (gitignored — run bun run db:generate)
  agents/
    code-agent/            # coding-agent.ts (createAgent + AgentState { summary, files }), prompt.ts
    fragment-title-generator/  # names generated apps (gpt-4o-mini)
    response-generator/    # writes the assistant's chat reply (gpt-4o-mini)
  tools/                   # agent tools: one folder per tool (terminal, read, create-or-update-files, web-search)
    <tool>/tool.ts         # factory `(sandboxId) => createTool({...})`; stateless ones like webSearch() take no arg
    <tool>/helpers.ts      # blocking rules, timeouts, truncation
    <tool>/index.ts        # re-exports the tool factory
  inngest/
    client.ts              # Inngest instance (id: "vibe")
    utils.ts               # TEMPLATE, getSandboxId/getSandbox, parseAgentOutput, MAX_ITER
    functions/
      index.ts             # exports all functions for the serve() route
      code-agent-function.ts  # main background job: sandbox → agent network → save to db
      gen-proj-name-fun.ts    # names the project (gpt-4o-mini)
  lib/
    env.ts                 # Zod env validation (see above)
    db.ts                  # Prisma client singleton (cached on global in dev)
    usage.ts               # credit consume/restore/status via rate-limiter-flexible (Usage table)
    utils.ts               # cn() helper
  modules/<module>/server/procedures.ts  # tRPC procedures per feature; each module also owns its UI in <module>/ui/
  trpc/
    init.ts                # createTRPCContext, baseProcedure, createTRPCRouter
    client.tsx             # client provider (NEXT_PUBLIC_APP_URI for SSR base URL)
    server.tsx             # server caller + options proxy ("server-only")
    routers/_app.ts        # root router — register new routers here
    query-client.ts
prisma/
  schema.prisma            # Prisma schema (PostgreSQL)
  migrations/
sandbox/nextjs/            # E2B sandbox template source
  template.ts              # Template definition (create-next-app + shadcn, node:22-slim)
  build.dev.ts / build.prod.ts  # Template.build scripts (read E2B_API_KEY via dotenv)
  compile_page.sh          # start cmd: runs `next dev --turbopack` on port 3000
```

## Key patterns

### Database (Prisma 7)
- `PrismaClient` is imported from `@/generated/prisma/client` (NOT `@prisma/client`), with the `PrismaPg` pooling adapter.
- `src/lib/db.ts` reuses one client across dev hot-reloads via a `global` cache (`env.NODE_ENV !== "production"`). Do not import `PrismaClient` from `@prisma/client` and do not instantiate your own in modules.
- After editing `prisma/schema.prisma`, run `bun run db:generate` (client is gitignored). Prisma 7 uses `prisma.config.ts` for the datasource URL; no `url` in `schema.prisma`.
- New migrations: `bun run db:migrate` (or `--create-only` then `db:migrate:deploy`).

### Credits / usage
- `src/lib/usage.ts` wraps `RateLimiterPrisma` over the `Usage` table (`rate-limiter-flexible`). `consumeCredits()` is called first in the `projects.create` and `messages.create` mutations and throws `TOO_MANY_REQUESTS` when the user is out of credits; `restoreCredits()` refunds a consumed credit if the create/dispatch after it fails; `getUsageStatus()` backs the `usage.status` query.
- The catch block in those mutations uses `error instanceof Error` to distinguish database errors (returns generic "Something went wrong...") from rate-limit rejections (non-`Error` `RateLimiterRes`, returns "You have run out of credits"). Always `console.error` the original error — the user-facing message is intentionally generic.

### tRPC — adding an endpoint
1. Create `src/modules/<feature>/server/procedures.ts` exporting a router built from `createTRPCRouter` / `baseProcedure` (`@/trpc/init`).
2. Register it in `src/trpc/routers/_app.ts`.
3. Client side: `const trpc = useTRPC()` then `trpc.<router>.<proc>.queryOptions()` / `.mutationOptions()` (TanStack Query pattern — see `src/app/page.tsx`).

### Inngest + Agent Kit — adding a tool
1. Create `src/tools/<name>/tool.ts` (+ `helpers.ts` for blocking rules, timeouts, truncation, and `index.ts` re-export).
2. Tools are **factory functions** taking `sandboxId` (except stateless ones like `webSearch()`): `export const terminalTool = (sandboxId: string) => createTool({...})`.
3. Register in `src/agents/code-agent/coding-agent.ts` and describe it in `src/agents/code-agent/prompt.ts` (the agent depends on accurate tool descriptions).
4. New background jobs: create in `src/inngest/functions/`, export from `functions/index.ts`, and send events via `inngest.send({ name: "...", data })`.
5. Test locally: `bun run inngest` + `bun run dev`, trigger the event in the Inngest dev UI.

### Sandbox templates
- `sandbox/nextjs/template.ts` bakes create-next-app@16.2.10 + all shadcn components into the image; the sandbox dev server is **already running** on port 3000 via `compile_page.sh` — the agent must never run `dev/build/start` commands (blocked in the terminal tool + prompt).
- Rebuild after changing the template: `bun run template:build:dev` (writes `vibe-nextjs-dev`).

## Code style

- **Comment the "why", not the "what"** — explain intent, non-obvious decisions, and gotchas; don't restate the code. Match the existing style: `/** ... */` doc blocks on exported functions/tools (see `src/tools/*/tool.ts`), `//` inline notes for tricky logic (see `src/lib/db.ts`, `src/trpc/client.tsx`).
- **Write clean code** — small, focused functions with descriptive names; no dead code, TODOs, or placeholder stubs; follow existing conventions (named exports, PascalCase components, kebab-case filenames, `@/` imports); strict TypeScript — no `any` where a real type exists.
- **Keep comments truthful** — update or delete comments when the code they explain changes; a stale comment is worse than none.

## Git workflow

When asked to open a PR for the current changes, follow this exact order — do not skip steps:

1. **Inspect first** — run `git status`, `git diff`, `git diff --stat`, and `git log --oneline -10` to understand the changes before touching anything.
2. **Branch from fresh `main`** — `git switch main` → `git pull --ff-only` → `git switch -c <type>/<kebab-name>`. Branch name must match the change (e.g. `feat/env-validation`, `fix/sandbox-template-dev-and-prod`).
3. **Make atomic commits** — one logical change per commit, each self-contained. Stage only intended files (`git add <file>`), never `git add -A` blindly, never commit secrets. **Conventional Commits** are enforced by commitlint (husky `commit-msg` hook); `bun run lint` runs on `pre-commit`. Example: `feat(env): add zod-based env validation module`.
4. **Verify before pushing** — run in order and fix any failure before continuing:
   - `bun run db:generate` (required first; the Prisma client is gitignored)
   - `bun run lint`
   - `bun run typecheck`
   - `bun run build`
5. **Push the branch** — `git push -u origin <branch>`.
6. **Hand off the PR** — `gh` is **not installed**, so do not try it. Open the PR manually via the web UI and give the user the link: `https://github.com/Arijit-mondal099/vibe/compare/main...<branch>`. Summarize the commits so they can review and merge via the UI.

- Only create branches, commit, push, or open PRs when **explicitly asked**.
- CI (`.github/workflows/ci.yml`) re-runs lint → typecheck → build on every push/PR to `main` as a backstop — it must already pass locally before you push.

## Gotchas

- **Do not import `@/lib/env` or `@/lib/db` from client components** — `env.ts` calls `process.exit(1)` and `db.ts` is server-only; bundle errors are confusing.
- **`src/generated/prisma` is gitignored** — a fresh checkout must run `bun run db:generate` before `typecheck`/`build`.
- **SSL mode in `DATABASE_URL`**: use `sslmode=verify-full` (not `require`). With `pg-connection-string@2.14.0`, `require`/`prefer`/`verify-ca` are treated as `verify-full` and emit a deprecation warning. Update both local `.env` and Vercel environment variables.
- **Inngest production keys**: `new Inngest({ id: "vibe" })` reads `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from env at runtime — they are NOT in the Zod schema in `src/lib/env.ts` but must be set in Vercel for `inngest.send()` calls to work in production.
- Use the `@/` alias for app imports; within `src/tools/*`, tools import `getSandbox` from `@/inngest/utils` and `AgentState` from `@/agents/code-agent`.
- Zod is v4 — error options use `{ error: "..." }`, not v3's `{ message }`.
- Do not add `.env`-only secrets to committed code; server-side secrets must not be `NEXT_PUBLIC_`-prefixed (they get inlined into the client bundle).
- Check `node_modules/next/dist/docs/` before using any Next.js API — Next 16 has breaking changes vs. older versions.
