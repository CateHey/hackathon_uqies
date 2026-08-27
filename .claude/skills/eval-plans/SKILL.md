---
name: eval-plans
description: Run the Free Me AI evals against the golden profiles and interpret failures. Use after any change to packages/ai prompts or packages/core schemas.
---

1. Confirm with the user before running anything that calls the Claude API — `pnpm eval:golden` costs money. `pnpm eval` itself is free (it reads golden JSON).
2. If prompts or schemas changed, run `pnpm eval:golden` to regenerate golden plans, then `pnpm eval`. Otherwise run `pnpm eval` only.
3. For every failing assertion, explain in one line what the plan did wrong (e.g. "Sarah's plan marked property as relevance 4; expected ≤ 2").
4. Propose the smallest prompt or schema change that fixes it. Do not edit golden JSON by hand.
5. Report token usage and cost from the eval output.
