# Contributing to Vibe

Thanks for your interest in contributing! Vibe is open source and we welcome bug reports, feature ideas, docs, and code.

Please read [AGENTS.md](AGENTS.md) for project conventions before you start — it documents the stack, commands, and git workflow in detail. This file covers the essentials for contributors.

## Getting started

### 1. Fork & clone

```sh
git clone https://github.com/Arijit-mondal099/vibe.git
cd vibe
```

### 2. Install dependencies

Use **Bun** (Node >= 22, pinned in `.nvmrc`). Never use npm/yarn/pnpm.

```sh
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Copy the variables below and fill in your own values — **do not commit real secrets**.

```sh
NEXT_PUBLIC_APP_URI=http://localhost:3000

# Inngest dev env
INNGEST_DEV=1

# PostgreSQL connection string
DATABASE_URL=

# Clerk API keys (from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# OpenAI API key
OPENAI_API_KEY=

# E2B sandbox API key + template
E2B_API_KEY=
VIBE_TEMPLATE=tests-default-team-30d4/vibe-nextjs-dev

# Tavily API key (web search tool)
TAVILY_API_KEY=

# Backblaze B2 bucket (used to store generated project archives for export)
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
B2_REGION=us-east-005
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com

# Inngest production keys (only required in production; leave commented for local dev)
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
```

Required variables are validated at import time by `src/lib/env.ts` — a missing value will exit the process with an error.

### 4. Set up the database

```sh
bun run db:generate   # generate the Prisma client (gitignored)
bun run db:push       # push the schema to your dev database
```

### 5. Run the app

Two services run side by side:

```sh
bun run dev        # Next.js dev server → http://localhost:3000
bun run inngest    # Inngest dev server → http://localhost:3288 (background jobs)
```

Use `bun run db:studio` to inspect the database.

## Development workflow

- **Branch from `main`** and keep changes on a feature branch: `git switch -c <type>/<kebab-name>`.
- **Keep commits atomic** — one logical change per commit, and stage only the files for that change.
- **Conventional Commits** are enforced by commitlint (husky `commit-msg` hook), e.g. `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`.
- `bun run lint` runs automatically on every commit via husky `pre-commit`.

## Code style

- **TypeScript (strict)** — no `any` where a real type exists.
- **Zod v4 syntax** — error options use `{ error: "..." }`, not v3's `{ message }`.
- **Comment the "why", not the "what"** — explain intent and non-obvious decisions; don't restate the code.
- Keep components small and focused; follow existing file/folder conventions in `src/`.

## Verifying your work

Run these before opening a PR — CI re-runs all of them:

```sh
bun run db:generate   # required first; the Prisma client is gitignored
bun run lint
bun run typecheck
bun run build
```

## Sandbox templates

The E2B sandbox template bakes a Next.js + shadcn/ui project into a reusable image. If you change `sandbox/nextjs/template.ts`, rebuild the template:

```sh
bun run template:build:dev   # writes the dev template (vibe-nextjs-dev)
bun run template:build:prod  # writes the prod template (vibe-nextjs-prod)
bun run template:list        # list available E2B templates
```

## Submitting a pull request

1. Make your changes on a branch from fresh `main`.
2. Ensure the verification commands above all pass.
3. Push the branch and open a PR against `main`.
4. Summarize your changes in the PR description so maintainers can review.

## Reporting issues

Before opening an issue, search the existing issues to avoid duplicates. Include:

- A clear, descriptive title.
- Steps to reproduce (for bugs).
- Expected vs. actual behavior.
- Environment details (browser, OS) if relevant.

## Need help?

Check the [README](README.md) for product overview and [AGENTS.md](AGENTS.md) for project facts. For anything else, open a discussion or issue and we'll get back to you.