# 🚀 Free Me

**Discover *your* path to financial freedom.**

A personalised financial-freedom journey for young Australians. Live at
**https://hackathon-uqies-web.vercel.app** — no sign-up needed to look around.

---

## The 60-second version

Young people have unlimited access to financial information and almost no personal direction. One
creator says buy property, the next says index funds, the next says crypto. The question nobody
answers is the only one that matters: **"What should *I* do next?"**

Free Me asks what freedom means to *you*, takes your real numbers, and turns both into a journey you
can see, understand and follow — one clear next step at a time, with the reasoning attached to every
single item.

The same plan can be experienced two ways, switched with one button:

> **🎮 Explore** — your journey as a world: places, connections, and your own Freedom City at the end.
> **📊 Professional** — the same plan as a plain dashboard: position, priority, next steps, what to learn.
>
> *Your journey doesn't change. How you experience it does.*

---

## The problem, in Australian terms

A 21-year-old in Brisbane on a part-time wage, with a HECS-HELP debt they don't fully understand, rent
taking most of their income, a house deposit that feels theoretical, and superannuation they've never
looked at — is served the *same* generic content as a 40-year-old with an investment property.

Three specific failures:

| What exists | What's missing |
|---|---|
| Budgeting apps that categorise the past | Nothing that says where you're *going* |
| Financial education that teaches concepts | Nothing that says which concept *you* need *now* |
| Advice, gated behind a licensed adviser and a fee most students can't justify | Honest, personal *direction* that stops short of advice |

Free Me lives in that third gap: **personal direction without crossing into personal advice.**

---

## How it works

**1 · What does freedom mean to you?**
One sentence, in their words. *"I want to be able to travel without worrying about money."* This is not
decoration — it is quoted back throughout the plan and shapes the destination.

**2 · A short, honest profile.**
Income, expenses, savings, debt, goals with an amount and a date, financial knowledge, risk comfort. No
bank connection, no transaction import — the person types what they know.

**3 · A rules engine does the arithmetic. The AI does the reasoning.**
This split is the core engineering decision. Deterministic TypeScript computes every number a user
will act on — emergency-fund target, savings rate, months to each goal, required monthly contribution,
debt-to-income. Claude receives those figures **as facts** and produces the *structure* of the journey
and the *explanations*. The model never does arithmetic that reaches a user.

**4 · The map appears instantly; the personalised version arrives behind it.**
A rules-based map renders in about a second, so nobody stares at a spinner. The AI-generated plan is
built in the background (measured: ~76 seconds) and swaps itself in when ready — automatically if the
person hasn't started ticking things off, or with their permission if they have.

---

## Sarah — a worked example

*21, university student, $1,800 in, $1,500 out, $800 saved, wants Japan in 18 months and financial
independence eventually.*

The rules engine computes: a **$3,000** two-month buffer target, **$2,200** short, **$300/month** surplus,
and — the uncomfortable one — Japan needs **$334/month** but she's on track for 20 months against an
18-month deadline. **She is behind, and the app says so.**

Her map opens on *Security Harbour* with one next step: **build a $3,000 buffer**. The reasoning the
model wrote, in her plan:

> "You have $800 set aside, which covers about 0.53 months of your spending — a $2,200 gap to a
> two-month buffer of $3,000. You carry no debt, which is a real head start, so this is the only thing
> standing between you and building freely. A buffer is what lets you say yes to a trip without worrying."

Her Freedom City: **🌴 Trip to Japan · Financial independence · Financial security.**

---

## What makes it different

**1 · Bridges — goals that compete for the same dollars.**
Most tools treat goals as independent lists. Free Me draws the trade-off explicitly:

> *"Money committed to long-term growth is money not available for a trip 18 months away."*

That sentence is generated for that person, connecting their two actual goals. It is the thing a good
adviser says out loud and an app almost never does.

**2 · Every path is rated for you — including the ones the answer is "not yet" for.**
Shares & funds, property, side income and crypto are all on the map, each with a 1–5 relevance rating
and an honest reason. For Sarah, crypto is one star:

> "You describe yourself as moderate on risk and you have a trip with a fixed date 18 months out, and
> digital assets can swing far more than that timeframe allows."

For Priya (29, deposit saved, no debt) it's two. Same product, different reading. **Nothing is ever
locked** — anything can be opened, read and learned about; the map guides rather than gates.

**3 · A "why" on everything, by construction.**
Every region, connection and step carries its reasoning as a field in the plan, written with that
person's figures. The "Why?" button doesn't ask a model to justify a decision after the fact — the
reasoning already exists, and a deeper explanation is one tap further.

**4 · Lessons that rewrite themselves.**
Ten short lessons — budgeting through to crypto volatility. "Personalise for me" rewrites the lesson for
the reader's level and goals, swapping the worked example for one using their own numbers.

**5 · "I have $1,000 — what do I do with it?"**
A suggested split across their plan with a reason per line, adjustable with sliders that keep the total
fixed, saved back into their progress. The app helps them decide; it never decides for them.

---

## Education, not advice — enforced in code

This is a deliberate product boundary, not a disclaimer bolted on at the end.

- **Never** a product, ticker, fund, broker, bank, exchange or specific cryptocurrency. Never
  "you should buy X."
- A **validation gate** in the pipeline rejects a generated plan containing advice language or product
  names, retries with the errors listed, and falls back to a fully rules-based plan rather than ship
  something that crosses the line. The same gate filters personalised lessons paragraph by paragraph
  *while they stream*.
- Every plan carries the disclaimer as data, shown in both modes: *"Free Me provides general financial
  education, not personal financial advice."*
- No bank connections, no transaction data, no product recommendations, no execution.

**Positioning for Australia:** Free Me is built to sit on the general-information side of the line ASIC
draws between general and personal advice. The product explains, prioritises and teaches using figures
the person entered themselves — it does not recommend a financial product. *A licensed review before any
public launch is on the roadmap and is not optional; this document is not a legal opinion.*

---

## See it yourself (2 minutes)

**https://hackathon-uqies-web.vercel.app**

| | |
|---|---|
| **No account** | Landing page → *Open in Explore mode*, or **/demo** for five different people |
| **Demo accounts** | `sarah@demo.free-me.app` (also liam / priya / marco / ana) · password `FreeMe-demo-2026` |
| **Live AI** | *Start your journey* → instant map → personalised version swaps in ~1–1.5 min later |

**Suggested walkthrough:** `/demo` → open Sarah → toggle **Explore ⇄ Professional** (same plan, two
faces) → open *Security Harbour* → **Why?** → set the buffer to $3,000 → a new path opens → *Learn* →
**Personalise for me** → *Allocate* $1,000.

The five personas are deliberately different: a student with $300, a professional saving a deposit,
someone with $60,000 of debt, and someone with no income at all — because the point is that they get
genuinely different maps, not the same map with different numbers.

---

## Under the hood

| | |
|---|---|
| **Web** | Next.js (App Router), React, TypeScript strict, Tailwind, Framer Motion |
| **AI** | Claude Opus 5 via structured outputs — the plan schema *is* the response format, so the model cannot return a malformed plan |
| **Correctness** | Zod schemas shared by every layer; a rules engine with ~78 tests; post-validation of referential integrity, graph reachability, ranges and banned language |
| **Data** | Supabase (Postgres + Auth), row-level security, guest sessions that migrate to an account on sign-up, append-only plan history with token usage for cost tracking |
| **Deployment** | Vercel, auto-deploy from `main`, health endpoint reporting AI/database/auth state |
| **Testing** | ~174 automated tests plus a browser suite (desktop + phone) that runs against production |
| **Cost** | ~US$0.18 and ~76 s per personalised plan at the current effort setting; capped at 5 AI generations per person per day |

Shared TypeScript packages (schemas, rules engine, map layout, API client) mean the planned iOS/Android
app renders the *same* plan object — no logic is duplicated per platform.

---

## Status and what's next

**Working today:** onboarding, AI plan generation with background upgrade, both modes, region detail
with progress that opens new paths, ten lessons with personalisation, allocation, accounts and
persistence, five demo journeys, deployed and tested in production.

**Next:** native iOS/Android (Expo, sharing the same packages) · plans that evolve as progress is made ·
"what if" sliders on the trade-off bridges · Australian modules (HECS-HELP, superannuation, first-home
schemes) as first-class content · a licensed compliance review.

**Open questions we'd genuinely like input on:** where the general-information line should sit for a
product this personal; whether the map or the dashboard should be the default for a first-time user;
and whether an education-first product can hold attention without the dopamine loops we've deliberately
avoided.

---

## Before presenting — numbers to source

This document deliberately contains no statistics we haven't verified. To strengthen the opening, source
these from primary Australian sources rather than repeating figures from articles:

- Youth financial-literacy and confidence measures — **ASIC Moneysmart** research, **HILDA Survey**.
- Rental and cost-of-living pressure on 18–30s — **ABS** (Australian Bureau of Statistics).
- HECS-HELP debt scale and repayment thresholds — **ATO** / **Department of Education**.
- First-home deposit timelines — **ABS** housing data, or a bank's published research (attribute it).

---

*Free Me — a University of Queensland hackathon project. Built with Claude Code.*
*General financial education, not personal financial advice.*
