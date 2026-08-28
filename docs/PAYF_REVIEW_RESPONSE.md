# PAYF — the external review, checked against the actual repo

That review was written without the code. Here it is mapped onto what we really have, what it got
right, where it's wrong for *this* codebase, and what's left to decide.

---

## 1 · Three things the review got right

These are real gaps. I verified each against the code.

### 1.1 Goals have no balance of their own — **confirmed, biggest gap**

Today `Goal` is `{ id, type, label, targetAmount, targetDate, priority }`. There is no
`currentBalance`. The rules engine derives one: it takes savings above the emergency buffer and
pours it into goals *in priority order* (`computeMetrics` → `goalProjections[].funded`).

That breaks in exactly the way the review says:

| | What happens now |
|---|---|
| Zuko, $520k saved, one goal | All $496k spare lands on the goal ✓ works by accident |
| Mike, two goals | Goal 1 takes all spare; **goal 2 starts from $0** ✗ wrong |
| "I have $30k earmarked for the deposit" | Cannot be expressed at all ✗ |

**Fix:** `Goal.currentBalance` (optional). When set, it's used; when not, the waterfall still fills in.
Non-breaking. **Size S in core, S in onboarding.**

### 1.2 Some goals are not savings goals — **confirmed, and it makes us look stupid**

Mike's "$1M by 35 via my own venture". Run it through what I built today and the app answers:

> "It would take **$12,925 a month**, which is more than you have spare right now."

Arithmetically perfect. Useless. He closes the app. The review's fix is right: goals need a flag.

**Fix:** `Goal.fundedBy: "savings" | "growth" | "mixed"`. For a `growth` goal, PAYF stops trying to
fund it monthly and says so — *"This isn't a savings goal. Here's what savings alone contributes by
2032; the rest has to come from the venture."* Then it points at the goal he **can** fund: the
$65k deposit at ~$694/month. **Size S in core, M in UI copy.**

### 1.3 One currency per person — **confirmed**

`FreedomProfile.currency` is a single field; Mike's apartment is priced in **US$**. Today I sidestepped
it by pricing his goal in AUD.

**Fix (small):** `Goal.currency` + one stored FX assumption, both amounts shown. **Not** a live FX
feed. **Size S.** (Full multi-currency accounting is a different product.)

---

## 2 · What the review couldn't know: half of it is already built

All of this landed today and is committed with tests.

| Review layer | Our reality |
|---|---|
| **L1 · PAYF waterfall** | ✅ `rules/pay-yourself.ts` — safety net → goals by deadline → flexible. Matches their pseudocode almost line for line |
| **L2 · Required-monthly solver, projection curve** | ✅ `rules/growth.ts` — `requiredMonthly`, `projectBalance`, `projectSeries`, `requiredRate` (bisection) |
| **L3 · Gap Solver** | ✅ `waysToGetThere` — returns 3–4 ranked levers exactly as specified |
| **L4 · Scenarios** | ✅ engine (`compareScenarios`) · ❌ no UI, no saved named scenarios |
| **L0 · Disclaimer wrapper** | ✅ `DISCLAIMER` + banned-terms validator + rendered in both modes |
| **L0 · Design tokens** | ✅ orange `#FF7A1A` + green `#3DDC84`, validated for contrast and colour-blindness |
| **L5 · Progress** | 🟡 per-goal `funded / remaining / onTrack` and step progress exist · ❌ no drift-from-curve |
| **L0 · Assumptions as data** | ❌ `RATE_PRESETS` is hardcoded in `growth.ts` — the review is right, it should be versioned data |
| **L6/7 · Notifications, streaks** | ❌ nothing |
| **L8 · Vision board** | 🟡 all the data exists; needs a page |

Their gap-solver levers vs what `waysToGetThere` already returns:

| Review lever | Ours |
|---|---|
| Extend deadline | `more_time` ✅ |
| Reduce target | `adjust_goal` ✅ |
| Increase capacity | `save_more` ✅ |
| Shift allocation | `let_it_grow` ✅ — **and we go further than they ask** |
| Deprioritise another goal | `compareScenarios` ✅ |

On "never present the allocation lever alone": we don't present it at all above **12% a year**. Zuko's
$2M in four years is arithmetically reachable at ~26%, so the app says:

> "It would take about 26% growth a year to arrive on time — far beyond what any plan should count on.
> The amount or the date has to move."

---

## 3 · Where the review is wrong for this codebase

| Their advice | Why not here |
|---|---|
| "`goals` — **NEW** table" | Goals already exist inside the profile document and drive the whole map. It's **EXTEND**, not new |
| "`users` — EXTEND with net_income…" | We have no users table; the profile lives in `sessions.data` jsonb. Same fields, different home |
| "`projections` — cache the monthly curve" | **Skip.** Our projection is a sub-millisecond pure function. A cache table buys nothing and invites staleness |
| "Store the result — don't recompute on render" | Store for **history and audit** (we already version plans). Recompute for display — otherwise reordering goals shows stale numbers |
| "Vision board deliberately last" | **Disagree.** It's read-only over data we already have — no structural risk, ships in a day, and it's the emotional hook of the whole product |

---

## 4 · The migration, for our schema

`0002_payf.sql` — additive, nothing existing breaks.

```sql
-- Goals stay inside the profile document (they drive the map). Schema change only:
--   Goal + currentBalance?, currency?, fundedBy: "savings" | "growth" | "mixed", imageEmoji?

create table assumptions (            -- versioned, never hardcoded (review was right)
  key text, label text, annual_rate numeric, note text,
  source text, effective_date date, primary key (key, effective_date));

create table savings_plans (id, session_id, user_id, monthly_total numeric,
                            annual_rate numeric, lines jsonb, created_at);  -- history/audit
create table scenarios     (id, session_id, user_id, name text, excluded_goal_ids text[], created_at);
create table check_ins     (session_id, day date, kind text, unique(session_id, day));
create table milestones    (id, session_id, kind, value numeric, achieved_at, celebrated_at);
create table message_templates (id, key, tone, locale, category, body);      -- funny copy as rows
create table notification_prefs (user_id primary key, tone, quiet_from, quiet_to, frequency);
create table push_subscriptions (id, user_id, endpoint, keys jsonb);         -- only if we do L6
```

RLS mirrors the existing policies. `contributions` deliberately omitted until we track money over
time — which is what Layer 5's drift detection actually needs.

---

## 5 · Revised order

**Now (≈1 day) — close the three gaps.** Per-goal balance · `fundedBy` flag · goal currency.
Cheap, and everything downstream is wrong without them.

**Next (≈2 days) — surface what's already built.** The `/save` screen: the PAYF split, the gap
solver's levers, the scenario switch. *The engines exist; they have no UI.*

**Then (≈1 day) — the vision board.** Read-only, zero risk, maximum emotional payoff.

**After that — Layer 5 properly.** Contributions over time → drift from the curve → the honest
"sustained drift" rule the review proposes (two missed months, or >10% below curve), each alert
arriving **with a lever, never bare**.

**Last — streaks and notifications.** The review is right that these before Layer 5 are
"notifications about nothing".

---

## 6 · Four decisions I need from you

1. **Per-goal balances:** ask people to split their savings across goals during onboarding (more
   friction, more truth), or keep the automatic waterfall with an optional override? *My vote:
   automatic, with an "edit" on each goal.*
2. **Mike's $1M:** when a goal is `growth`, what does the screen show? *My vote: what savings alone
   contributes by the date, then "the rest has to come from the venture" — and we don't model the
   venture.*
3. **Currency:** goal-level currency with a stored assumption? *My vote: yes, small and honest.*
4. **Tone:** the review wants tone as a user setting. Playful for Aman's $6,500, sober for Zuko's $2M.
   *My vote: agreed — one `tone` column, default chosen by goal size.*

---

## 7 · One correction to their maths

Their table has Zuko "from zero" needing $36,969/month, and "with $1.2M already" needing $8,780. Our
Zuko has **$520k**, which is why our engine returns *unreachable at any sane rate*. The conclusion is
the same and it's the point of the persona: **the app should tell him the number doesn't work.**
Most products wouldn't.
