# Free Me — project guide for Claude Code

## What this is
A personalised financial-freedom journey app (web + iOS/Android).
Specs — read the relevant section before starting any task:
- FREE_ME_CONCEPT.md            product behaviour, screens, tone
- FREE_ME_ARCHITECTURE.md       data model (§4), AI engine (§5), API (§6), web (§7), mobile (§8), layout (§9)
- FREE_ME_DEVELOPMENT_PLAN.md   the phase you are working in

## Non-negotiables
1. ONE canonical object: `FreedomPlan` in packages/core. Explore mode and Professional
   mode are renderers of it. Never add mode-specific business logic or mode-only fields.
2. Numbers come from the rules engine (packages/core/src/rules). The LLM never does
   arithmetic that reaches the user.
3. Every region, bridge and step has a plain-language `why`.
4. Education, not advice. Never name products, tickers, funds, brokers, or write
   "you should buy/sell". The banned-terms check in packages/ai/src/validate.ts is a gate.
5. ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY are server-only. Never import
   @anthropic-ai/sdk or use a service key in apps/web client components or apps/mobile.
6. Every API input and output is validated with the shared Zod schemas from packages/core.

## Stack
pnpm workspaces + Turborepo · TypeScript strict · Zod 4 · Vitest
apps/web: Next.js App Router, Tailwind v4, Framer Motion, TanStack Query, Zustand
apps/mobile (Phase 6): Expo + Expo Router, NativeWind, react-native-svg, Reanimated
Backend: Next.js route handlers, in-memory repository now → Supabase in Phase 4
AI: Claude Opus 5 (`claude-opus-5`) via @anthropic-ai/sdk — structured outputs with
    client.messages.parse + zodOutputFormat; effort via output_config.effort;
    cache_control on the system prompt; check stop_reason === "refusal".
Internal packages are consumed as TypeScript source (no build step); Next transpiles them.

## Commands
pnpm install            install everything
pnpm dev                web app on http://localhost:3000
pnpm typecheck          tsc across all packages — must pass before you finish
pnpm test               vitest across all packages — must pass before you finish
pnpm lint               eslint (web)
pnpm eval               AI evals against golden JSON — no API calls
pnpm eval:golden        regenerate golden plans — COSTS MONEY, ask before running
pnpm eval:template      template (no-AI) golden plans for demo/local use

## Conventions
- Files kebab-case; React components PascalCase, one per file; hooks `use-*.ts`.
- Tests beside the code as `*.test.ts(x)`. packages/core rules + layout need tests for
  every branch. UI gets a smoke test, not snapshot spam.
- No `any`. Derive types from Zod schemas (`z.infer`). No duplicated type definitions.
- Shared logic goes in packages/*, never copied between apps/web and apps/mobile.
- New dependency → say why in the commit body.
- Conventional commits: feat / fix / chore / docs / test / refactor. Small commits.
- Finish every task by running `pnpm typecheck && pnpm test` and reporting the real result.

## Where things live
packages/core/src/schema/     FreedomProfile, FreedomPlan, Region, Bridge, Step (Zod)
packages/core/src/rules/      computeMetrics, applyProgress (unlocks), templatePlan (fallback)
packages/core/src/layout/     layoutFreedomMap — deterministic positions for both clients
packages/core/src/fixtures/   sarah, userA, userB, debtHeavy, zeroIncome profiles
packages/ai/src/              prompts/, generate-plan, explain, allocate, personalise-lesson, validate
packages/api-client/src/      typed fetch + TanStack Query hooks shared by web and mobile
packages/content/src/lessons/ lesson catalogue (TS modules with markdown bodies)
packages/tokens/              colours, region colours, type scale
apps/web/app/api/             route handlers (see ARCHITECTURE §6.2)
apps/web/lib/repository.ts    PlanRepository interface (in-memory now, Supabase in Phase 4)
evals/                        golden profiles + structural assertions

## Don'ts
- Don't call the Anthropic API from unit tests. Only evals/ may call it.
- Don't hand-edit evals/golden/*.json — regenerate with pnpm eval:golden (or eval:template).
- Don't add Explore-only or Professional-only fields to FreedomPlan.
- Don't read or print .env files.
