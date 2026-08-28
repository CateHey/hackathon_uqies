import { round } from "../utils/money";
import { PLAUSIBLE_MAX_RATE, projectBalance } from "./growth";

/**
 * Different futures that reach the same goal.
 *
 * "How much would I have to earn?" is a fairer question than "why aren't you saving more?", so
 * this module solves the goal for each lever a person can actually pull: the share of income they
 * put aside, what they earn, how fast their pay grows, and how long they give it.
 *
 * Every rate is an assumption the person sets. Nothing here recommends where to put money.
 */

export interface FutureLevers {
  /** Take-home pay per month, today. */
  monthlyIncome: number;
  /** Monthly spending that isn't going to the goal. */
  monthlyExpenses: number;
  /** Share of income put aside for this goal, 0–1. */
  savingsRate: number;
  /** Pay rise per year, 0–1. A raise lifts the contribution with it. */
  annualRaise: number;
  /** Assumed annual growth on the money already set aside, 0–1. */
  annualRate: number;
  months: number;
}

export interface FutureOutcome {
  finalBalance: number;
  reaches: boolean;
  /** Months to reach the target, when it gets there inside the horizon. */
  monthsToTarget: number | null;
  /** What goes aside in the first month and in the last, once raises are counted. */
  firstMonthly: number;
  lastMonthly: number;
  /** Total put aside across the whole period. */
  totalContributed: number;
}

/**
 * Simulate month by month: income rises with the raise, the contribution is a share of income,
 * and the balance compounds. Exact rather than closed-form, so raises and growth can both apply.
 */
export function simulateFuture(
  levers: FutureLevers,
  args: { current: number; target: number },
): FutureOutcome {
  const { monthlyIncome, savingsRate, annualRaise, annualRate, months } = levers;
  const monthlyGrowth = annualRate / 12;
  let balance = args.current;
  let income = monthlyIncome;
  let firstMonthly = 0;
  let lastMonthly = 0;
  let totalContributed = 0;
  let monthsToTarget: number | null = balance >= args.target ? 0 : null;

  for (let m = 1; m <= months; m++) {
    // Raises land once a year, at the start of each 12-month block.
    if (m > 1 && (m - 1) % 12 === 0) income = income * (1 + annualRaise);
    const contribution = Math.max(0, income * savingsRate);
    balance = balance * (1 + monthlyGrowth) + contribution;
    totalContributed += contribution;
    if (m === 1) firstMonthly = contribution;
    lastMonthly = contribution;
    if (monthsToTarget === null && balance >= args.target) monthsToTarget = m;
  }

  return {
    finalBalance: round(balance, 2),
    reaches: balance >= args.target,
    monthsToTarget,
    firstMonthly: round(firstMonthly, 2),
    lastMonthly: round(lastMonthly, 2),
    totalContributed: round(totalContributed, 2),
  };
}

/**
 * Round UP to `dp` decimals. Solved thresholds must never be rounded down — a rate a
 * ten-thousandth below the boundary is a future that quietly doesn't reach the goal.
 */
function ceilTo(v: number, dp: number): number {
  const f = 10 ** dp;
  return Math.ceil(v * f) / f;
}

/** Generic bisection on one lever, assuming more of it is always better. */
function solve(lo: number, hi: number, reaches: (v: number) => boolean, steps = 60): number | null {
  if (reaches(lo)) return lo;
  if (!reaches(hi)) return null;
  let a = lo;
  let b = hi;
  for (let i = 0; i < steps; i++) {
    const mid = (a + b) / 2;
    if (reaches(mid)) b = mid;
    else a = mid;
  }
  return b;
}

/** The share of today's income that would get there. null when even everything wouldn't. */
export function requiredSavingsRate(
  levers: Omit<FutureLevers, "savingsRate">,
  args: { current: number; target: number },
): number | null {
  const max = levers.monthlyIncome > 0 ? Math.min(1, Math.max(0, 1 - levers.monthlyExpenses / levers.monthlyIncome)) : 0;
  if (max <= 0) return null;
  const rate = solve(0, max, (v) => simulateFuture({ ...levers, savingsRate: v }, args).reaches);
  return rate === null ? null : Math.min(max, ceilTo(rate, 4));
}

/** The income that would get there at today's saving share. */
export function requiredIncome(
  levers: Omit<FutureLevers, "monthlyIncome">,
  args: { current: number; target: number },
): number | null {
  if (levers.savingsRate <= 0) return null;
  const income = solve(0, 1_000_000, (v) => simulateFuture({ ...levers, monthlyIncome: v }, args).reaches);
  return income === null ? null : Math.ceil(income);
}

/** The annual pay rise that would get there, everything else unchanged. */
export function requiredRaise(
  levers: Omit<FutureLevers, "annualRaise">,
  args: { current: number; target: number },
): number | null {
  const raise = solve(0, 1, (v) => simulateFuture({ ...levers, annualRaise: v }, args).reaches);
  return raise === null ? null : Math.min(1, ceilTo(raise, 4));
}

/** How long today's settings take. null when they never get there. */
export function monthsAtThisPace(
  levers: FutureLevers,
  args: { current: number; target: number },
  maxMonths = 600,
): number | null {
  const out = simulateFuture({ ...levers, months: maxMonths }, args);
  return out.monthsToTarget;
}

export type FutureKind = "today" | "save_more" | "earn_more" | "grow_income" | "more_time" | "out_of_reach";

export interface Future {
  kind: FutureKind;
  /** Short name for a tab or card. */
  title: string;
  /** One line, plain language, with the number in it. */
  headline: string;
  levers: FutureLevers;
  outcome: FutureOutcome;
  /** True when this future actually reaches the goal. */
  works: boolean;
  /** How far it asks the person to stretch, 0 = no change. Used for ordering. */
  stretch: number;
}

export interface FuturesInput {
  target: number;
  current: number;
  months: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  /** What is going to this goal today, as a share of income. */
  savingsRate: number;
  annualRaise?: number;
  annualRate?: number;
  /** Highest share of income we'd ever suggest putting aside. */
  maxSavingsRate?: number;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const money = (v: number) => `$${Math.round(v).toLocaleString("en-AU")}`;

/**
 * Four futures for one goal: today's path, and the smallest change to each lever that
 * would actually get there. Ordered by how much they ask of the person.
 */
export function exploreFutures(input: FuturesInput): { today: Future; futures: Future[] } {
  const base: FutureLevers = {
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses: input.monthlyExpenses,
    savingsRate: input.savingsRate,
    annualRaise: input.annualRaise ?? 0,
    annualRate: input.annualRate ?? 0,
    months: input.months,
  };
  const args = { current: input.current, target: input.target };
  const maxRate = input.maxSavingsRate ?? 0.5;

  const todayOutcome = simulateFuture(base, args);
  const todayMonths = monthsAtThisPace(base, args);
  const today: Future = {
    kind: "today",
    title: "Today's pace",
    headline: todayOutcome.reaches
      ? `Keep going exactly as you are and you get there — ${money(todayOutcome.finalBalance)} by then.`
      : `As you are, you reach ${money(todayOutcome.finalBalance)} of ${money(input.target)}.`,
    levers: base,
    outcome: todayOutcome,
    works: todayOutcome.reaches,
    stretch: 0,
  };
  if (todayOutcome.reaches) return { today, futures: [] };

  const futures: Future[] = [];

  // 1 · Put a bigger share aside.
  const rate = requiredSavingsRate(base, args);
  if (rate !== null && rate <= maxRate) {
    const levers = { ...base, savingsRate: rate };
    futures.push({
      kind: "save_more",
      title: "Save a bigger share",
      headline: `Put aside ${pct(rate)} of what you earn — ${money(input.monthlyIncome * rate)} a month instead of ${money(input.monthlyIncome * input.savingsRate)}.`,
      levers,
      outcome: simulateFuture(levers, args),
      works: true,
      stretch: (rate - input.savingsRate) * 4,
    });
  }

  // 2 · Earn more, saving the same share.
  const income = requiredIncome(base, args);
  if (income !== null && income > input.monthlyIncome) {
    const levers = { ...base, monthlyIncome: income };
    const lift = income - input.monthlyIncome;
    futures.push({
      kind: "earn_more",
      title: "Earn more",
      headline: `Earn ${money(income)} a month — ${money(lift)} more than now — and keep saving the same ${pct(input.savingsRate)}.`,
      levers,
      outcome: simulateFuture(levers, args),
      works: true,
      stretch: lift / Math.max(1, input.monthlyIncome),
    });
  }

  // 3 · Grow into it: a pay rise every year.
  const raise = requiredRaise(base, args);
  if (raise !== null && raise <= 0.35) {
    const levers = { ...base, annualRaise: raise };
    const out = simulateFuture(levers, args);
    futures.push({
      kind: "grow_income",
      title: "Grow into it",
      headline: `A ${pct(raise)} pay rise each year gets you there — you'd be putting aside ${money(out.lastMonthly)} a month by the end, up from ${money(out.firstMonthly)}.`,
      levers,
      outcome: out,
      works: true,
      stretch: raise * 3,
    });
  }

  // 4 · Give it longer.
  if (todayMonths !== null && todayMonths > input.months) {
    const levers = { ...base, months: todayMonths };
    futures.push({
      kind: "more_time",
      title: "Give it longer",
      headline: `Change nothing and you get there in ${todayMonths} months — ${todayMonths - input.months} later than planned.`,
      levers,
      outcome: simulateFuture(levers, args),
      works: true,
      stretch: (todayMonths - input.months) / Math.max(1, input.months),
    });
  }

  // Nothing worked: say it plainly rather than inventing a route.
  if (futures.length === 0) {
    futures.push({
      kind: "out_of_reach",
      title: "Not by saving",
      headline: `No change to saving, income or timing gets to ${money(input.target)} by then. This one needs a different kind of answer — or a different number.`,
      levers: base,
      outcome: todayOutcome,
      works: false,
      stretch: Infinity,
    });
  }

  futures.sort((a, b) => a.stretch - b.stretch);
  return { today, futures };
}

/**
 * What a "growth" goal — a business, equity, something that isn't a savings line — would need,
 * said honestly. We never model the venture itself; we say what saving contributes and leave the
 * rest where it belongs.
 */
export function growthGoalNote(input: {
  target: number;
  current: number;
  months: number;
  monthlyContribution: number;
  annualRate?: number;
}): { fromSaving: number; gap: number; headline: string } {
  const fromSaving = projectBalance({
    current: input.current,
    monthly: input.monthlyContribution,
    months: input.months,
    annualRate: input.annualRate ?? 0,
  });
  const gap = round(Math.max(0, input.target - fromSaving), 2);
  return {
    fromSaving,
    gap,
    headline:
      gap === 0
        ? `Saving alone would actually cover this — ${money(fromSaving)} by then.`
        : `Saving gets you ${money(fromSaving)} of ${money(input.target)}. The other ${money(gap)} has to come from what you build, not from your pay. We don't model that here — but we won't pretend a savings plan will do it either.`,
  };
}

export { PLAUSIBLE_MAX_RATE };
