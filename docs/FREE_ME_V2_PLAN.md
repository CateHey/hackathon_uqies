# Free Me v2 — Pay Yourself First, scenarios, streaks & celebration

Plan for the next build. Sizes: **S** ≈ half a day · **M** ≈ 1–2 days · **L** ≈ 3+ days.
"Reuse" is measured against what already exists in the repo today.

---

## 1 · The whole plan on one screen

| # | Feature | Size | Reuse | What's genuinely new |
|---|---|---|---|---|
| 1 | **Pay Yourself First** — monthly split across multiple goals | **M** | 🟢 High | A *recurring* split (today's `allocate` is one-off) |
| 2 | **Scenario switcher** — drop the car, the money moves to the master's | **M** | 🟢 High | Toggle goals on/off + re-rank, live recompute |
| 3 | **Growth illustrations** — what compounding does at different rates | **M** | 🟡 Some | Compound maths + a compliance decision (§2) |
| 4 | **Vision board** — your goals with images, % of the way there | **S–M** | 🟢 High | Goal imagery; the progress data already exists |
| 5 | **Milestones & celebration** — confetti, playful lines | **S** | 🟢 High | Milestone detection + a voice for the copy |
| 6 | **Streaks** — daily check-in, Duolingo-style | **M** | 🔴 Low | Check-in concept, streak maths, new table |
| 7 | **In-app nudges** — "moment" cards when you open the app | **S** | 🟡 Some | A nudge picker over existing signals |
| 8 | **Real push notifications** — daily, even when closed | **L** | 🔴 Low | Service worker, VAPID, subscriptions, scheduler |
| 9 | **Gentle off-track alerts** — "you're behind, here's the fix" | **S** | 🟢 High | Copy and thresholds only — `onTrack` already exists |

**Suggested order:** 1 → 2 → 5 → 4 → 9 → 7 → 3 → 6 → 8.
Items 1, 2 and 5 give the biggest demo moment for the least work.

---

## 2 · One decision before anything else

You asked for a split across **bonds and stocks using average interest rates**. That specific framing —
telling *this* person what proportion to put in which asset class — is the line between general
information and **personal advice** in Australia. It's the one feature that could put the product on the
wrong side of ASIC, and it's also the one our own validator would currently block.

The same idea works, and keeps its punch, framed as an **illustration the person drives**:

| ❌ Not this | ✅ This |
|---|---|
| "Put 60% in bonds and 40% in shares" | "If your savings grew at **X% a year** — you choose X — here's what it does to your timeline" |
| A recommended allocation | A slider from 0% to ~10%, with the maths shown |
| "Average return of asset class Y is Z" as a promise | "Different kinds of investments have historically had different average returns **and different risk**" + a link to the lesson |

Same educational value, no product, no recommendation, no promise. **You decide which framing we build
before Phase 3** — the rest of the plan doesn't depend on it.

---

## 3 · What we reuse (the good news)

Most of this already exists and is tested:

| Already built | Used by |
|---|---|
| `computeMetrics` → `goalProjections` with `funded`, `remaining`, `monthsToTarget`, `monthsUntilDeadline`, **`requiredMonthly`**, **`onTrack`** | Features 1, 2, 4, 9 |
| `allocate.ts` — `eligibleBuckets`, `ruleAllocation`, `allocationProblems`, AI + rules fallback | Feature 1 (change one-off → monthly) |
| `applyProgress` already returns `unlockedBridgeIds` and `completedRegionIds` | Feature 5 (events to celebrate, for free) |
| Region `progress` per goal, `personal_goal` regions, Freedom City pillars | Features 4, 9 |
| `validate.ts` banned-terms gate + retry + rules fallback | Feature 3 (extend the term list) |
| Zod schemas, session repository, plan history, auth, rate cap, tests, CI | Everything |

**Nothing above needs rewriting.** The new work is mostly *new pure functions in `packages/core`* plus
screens — which is the cheap end of this codebase.

---

## 4 · New code in `packages/core` (pure, testable, no AI)

```
rules/pay-yourself.ts     payYourselfPlan(profile, metrics, opts) → monthly split
                          buffer first → goals by urgency (deadline vs requiredMonthly) → flexible
rules/scenarios.ts        runScenario(profile, { activeGoalIds, priorities }) → new metrics + deltas
                          "drop the car → the master's arrives 7 months sooner"
rules/growth.ts           projectGrowth(monthly, years, annualRate) → balance over time
                          illustration only; the rate is an input, never a recommendation
rules/streak.ts           computeStreak(checkInDates, today) → { current, longest, atRisk }
rules/milestones.ts       detectMilestones(before, after) → first $100, 25/50/75/100%, buffer done,
                          first month saved, streak 7/30
```

Schema additions:

```
Goal            + emoji, + image?, + active (for scenarios), + note?
SavingsPlan     new — { monthlyTotal, lines: [{ goalId|buffer|flexible, amount, reason }] }
CheckIn         new — { date, kind: "opened"|"logged"|"lesson" }
Milestone       new — { id, kind, achievedAt, value }
```

**Rule kept:** `FreedomPlan` stays the one canonical journey object. `SavingsPlan` is *derived* from
profile + metrics, recomputed on demand, stored only for history.

---

## 5 · Database

Today: `sessions` (one jsonb document) + `plans` (history). That's fine for plan state, but streaks and
milestones need querying **by date**, so they get real tables.

```sql
-- new
create table check_ins   (user_id, session_id, day date, kind text, unique(session_id, day));
create table milestones  (id, session_id, user_id, kind, value numeric, achieved_at);
create table savings_plans (id, session_id, user_id, monthly_total numeric, lines jsonb, created_at);
create table push_subscriptions (id, user_id, endpoint, keys jsonb, created_at);  -- feature 8 only

-- changed
sessions.data jsonb  → gains goals[].emoji / .active, current savings plan, nudge state
```

RLS mirrors the existing policies (read your own rows; the API writes with the service key).
**Migration `0002_v2.sql`** — additive only, nothing existing breaks.

---

## 6 · Screens

| Screen | Status | Notes |
|---|---|---|
| `/save` **Pay Yourself First** | New | The monthly split. Sliders that keep the total fixed — reuse the `/allocate` interaction wholesale |
| `/save` scenario mode | New | Goal chips you can switch off; numbers re-run instantly (no AI, no wait) |
| `/vision` **Vision board** | New | Goal cards with imagery and % complete |
| `/map` | Extend | Celebration overlay on milestones; streak chip in the header |
| `/allocate` | Keep | One-off windfalls stay separate from the monthly habit |
| Region detail | Extend | Off-track note with the fix ("$40 more a month gets you there") |

---

## 7 · Phases

**Phase A — the savings core (M+M, ~3 days).** Pay Yourself First + scenario switcher.
*Demo line: "She wants a master's and a car. Drop the car — the master's arrives 7 months sooner."*

**Phase B — the feeling (S+S+S, ~1.5 days).** Milestones with confetti and playful copy, vision board,
gentle off-track notes.

**Phase C — the habit (M+S, ~2 days).** Streaks with a daily check-in, in-app nudge cards.

**Phase D — reach (M+L).** Growth illustrations (after the §2 decision) and real push notifications.

---

## 8 · Risks worth naming

| Risk | What we do |
|---|---|
| **Asset-class advice** (§2) | Decide the framing first; extend the banned-terms gate; keep "illustration" wording in the schema itself |
| **Streaks + money = guilt.** Duolingo can nag about verbs; nagging about savings hits differently | The check-in is "did you show up", never "did you save enough". No streak-loss shaming. Easy to turn off |
| **Playful copy going wrong.** "Spicy" and "financial stress" are a bad combination on a bad day | Curated message bank (human-written) as the default; AI lines pass the same validator + a tone check. Never joke about being behind |
| **Notification fatigue** | Max one a day, quiet hours, one-tap off, and permission asked *after* the first milestone — not on arrival |
| **Scope** | Phases A and B alone are a complete, demoable story. C and D are optional |

---

*Sizes assume the current stack and reuse; every new rules function ships with tests, as in the rest of
`packages/core`.*
