# 🚀 Free Me

**Discover your path to financial freedom.** A personalised financial-freedom journey: one AI-generated plan, two ways to experience it — 🎮 Explore (a world map) and 📊 Professional (a dashboard).

Specs:
- [FREE_ME_CONCEPT.md](FREE_ME_CONCEPT.md) — product concept
- [FREE_ME_ARCHITECTURE.md](FREE_ME_ARCHITECTURE.md) — technical architecture
- [FREE_ME_DEVELOPMENT_PLAN.md](FREE_ME_DEVELOPMENT_PLAN.md) — phase-by-phase build plan (Claude Code sessions)

## Commands

```
pnpm install            install everything
pnpm dev                web app on http://localhost:3000
pnpm typecheck          tsc across all packages
pnpm test               vitest across all packages
pnpm lint               eslint (web)
pnpm e2e                Playwright browser tests (needs `pnpm dev` running, or boots its own)
pnpm eval               AI evals against golden profiles (no API calls)
pnpm eval:golden        regenerate golden plans — calls the Claude API, costs money
pnpm eval:template      write template (no-AI) golden plans for local/demo use
```

## Setup

1. `pnpm install`
2. `cp apps/web/.env.example apps/web/.env.local` and fill in `ANTHROPIC_API_KEY` (or set `DEMO_MODE=true` to run from cached plans).
3. `pnpm dev`

## Demo data

- **/demo** lists five personas (Sarah, Liam, Priya, Marco, Ana); each opens a model-generated journey instantly.
- `pnpm seed:demo` creates matching **demo accounts** in Supabase with those journeys pre-loaded
  (`sarah@demo.free-me.app` … password `FreeMe-demo-2026`, or set `DEMO_PASSWORD`). Idempotent.
- `pnpm smoke https://your-deployment` drives the public API of a deployment (health, demo load, plan, Why?, lesson).
- Model generations are capped per session per day (`GENERATE_LIMIT_PER_DAY`, default 5); over the cap the person
  still gets a rules-engine map.

## How a plan is made

Creating a profile always returns a map **instantly** from the rules engine. With an API key, the model then
builds the personalised plan in the background (`PLAN_EFFORT`, default `medium`; goldens use `high`) and the map
shows a "Personalising your map…" pill until it swaps the upgrade in — automatically if you haven't ticked anything
yet, otherwise with a button so your progress isn't lost.

## Layout

```
apps/web            Next.js app + API route handlers
apps/mobile         Expo app (Phase 6)
packages/core       Zod schemas, rules engine, map layout (pure TypeScript)
packages/ai         prompts, generatePlan / explain / allocate / personaliseLesson, validation
packages/api-client typed fetch + TanStack Query hooks shared by web and mobile
packages/content    lesson catalogue
packages/tokens     design tokens
packages/config     shared tsconfig
evals               golden profiles + structural assertions
```
