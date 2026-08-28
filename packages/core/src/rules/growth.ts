import { round } from "../utils/money";

/**
 * "How do I actually get there?"
 *
 * Deterministic maths for reaching a target: what it takes to save your way there, how much
 * longer it would take, and what an assumed growth rate would do. Every rate here is an
 * ASSUMPTION the person chooses — this module never recommends where to put money, never
 * names an investment, and never presents a rate as a prediction.
 */

export interface GrowthInput {
  /** What is already set aside for this target. */
  current: number;
  /** Contribution per month. */
  monthly: number;
  months: number;
  /** Assumed annual growth, e.g. 0.05. Zero means a plain savings account. */
  annualRate: number;
}

/** Balance after `months`, compounding monthly, with contributions at each month's end. */
export function projectBalance({ current, monthly, months, annualRate }: GrowthInput): number {
  if (months <= 0) return round(current, 2);
  const r = annualRate / 12;
  if (r === 0) return round(current + monthly * months, 2);
  const grown = current * (1 + r) ** months;
  const contributions = monthly * (((1 + r) ** months - 1) / r);
  return round(grown + contributions, 2);
}

/** Month-by-month balances, for a chart. Index 0 is today. */
export function projectSeries(input: GrowthInput): number[] {
  const out: number[] = [];
  for (let m = 0; m <= input.months; m++) out.push(projectBalance({ ...input, months: m }));
  return out;
}

/** The monthly contribution that reaches `target` in `months`. null when the target is already met. */
export function requiredMonthly(args: {
  current: number;
  target: number;
  months: number;
  annualRate: number;
}): number | null {
  const { current, target, months, annualRate } = args;
  if (current >= target) return 0;
  if (months <= 0) return null;
  const r = annualRate / 12;
  if (r === 0) return Math.ceil((target - current) / months);
  const grown = current * (1 + r) ** months;
  const factor = ((1 + r) ** months - 1) / r;
  const needed = (target - grown) / factor;
  return needed <= 0 ? 0 : Math.ceil(needed);
}

/** Months needed to reach `target` at this contribution and rate. null if it never gets there. */
export function monthsToTarget(args: {
  current: number;
  target: number;
  monthly: number;
  annualRate: number;
  maxMonths?: number;
}): number | null {
  const { current, target, monthly, annualRate, maxMonths = 1200 } = args;
  if (current >= target) return 0;
  if (monthly <= 0 && annualRate <= 0) return null;
  for (let m = 1; m <= maxMonths; m++) {
    if (projectBalance({ current, monthly, months: m, annualRate }) >= target) return m;
  }
  return null;
}

/**
 * The annual rate that would get there on time at the current contribution.
 * Bisection over 0–30%. null when even 30% wouldn't do it — which is the honest answer.
 */
export function requiredRate(args: {
  current: number;
  target: number;
  monthly: number;
  months: number;
}): number | null {
  const { current, target, monthly, months } = args;
  if (months <= 0) return null;
  if (projectBalance({ current, monthly, months, annualRate: 0 }) >= target) return 0;
  const MAX = 0.3;
  if (projectBalance({ current, monthly, months, annualRate: MAX }) < target) return null;
  let lo = 0;
  let hi = MAX;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (projectBalance({ current, monthly, months, annualRate: mid }) >= target) hi = mid;
    else lo = mid;
  }
  return round(hi, 4);
}

/**
 * The highest annual growth a plan is allowed to lean on. Above this the maths still works,
 * but presenting it as a route would be selling a fantasy — so we name the number and say no.
 */
export const PLAUSIBLE_MAX_RATE = 0.12;

export type WayKind = "on_track" | "save_more" | "more_time" | "let_it_grow" | "adjust_goal";

export interface Way {
  kind: WayKind;
  /** One line the UI can show as a heading. */
  headline: string;
  /** The number behind it, when there is one. */
  value: number | null;
  unit: "currency_per_month" | "months" | "rate" | "currency" | "none";
}

export interface WaysInput {
  target: number;
  current: number;
  /** What is being put aside for this target each month right now. */
  monthly: number;
  /** Months until the deadline; null when there is no deadline. */
  months: number | null;
  /** The rate the person has chosen to assume. Default 0 — plain saving. */
  annualRate?: number;
  /** Ceiling for "save more": what they could reach at most, e.g. their whole surplus. */
  maxMonthly?: number;
}

export interface Ways {
  reachable: boolean;
  /** Where the current pace lands them by the deadline. */
  projected: number;
  shortfall: number;
  ways: Way[];
}

/**
 * Given a target and a pace, work out every honest route to it: keep going, put more
 * aside, take longer, assume growth, or change the goal. Ordered by how much they'd
 * have to change.
 */
export function waysToGetThere(input: WaysInput): Ways {
  const { target, current, monthly, months, annualRate = 0, maxMonthly } = input;
  const ways: Way[] = [];

  // No deadline: the only question is how long the current pace takes.
  if (months === null) {
    const m = monthsToTarget({ current, target, monthly, annualRate });
    ways.push({
      kind: m === null ? "adjust_goal" : "on_track",
      headline:
        m === null
          ? "At this pace it doesn't get there — put something aside each month, or set a smaller first target."
          : `Keep this up and you're there in ${m} month${m === 1 ? "" : "s"}.`,
      value: m,
      unit: "months",
    });
    return { reachable: m !== null, projected: projectBalance({ current, monthly, months: 120, annualRate }), shortfall: 0, ways };
  }

  const projected = projectBalance({ current, monthly, months, annualRate });
  const shortfall = round(Math.max(0, target - projected), 2);
  const reachable = shortfall === 0;

  if (reachable) {
    ways.push({
      kind: "on_track",
      headline: `On track — this pace gets you there with about ${Math.round(projected - target)} to spare.`,
      value: round(projected - target, 0),
      unit: "currency",
    });
    return { reachable, projected, shortfall, ways };
  }

  // 1 · Put more aside each month.
  const need = requiredMonthly({ current, target, months, annualRate });
  if (need !== null) {
    const extra = Math.max(0, Math.ceil(need - monthly));
    const withinReach = maxMonthly === undefined || need <= maxMonthly;
    ways.push({
      kind: "save_more",
      headline: withinReach
        ? `Put aside ${need} a month instead of ${Math.round(monthly)} — ${extra} more.`
        : `It would take ${need} a month, which is more than you have spare right now.`,
      value: need,
      unit: "currency_per_month",
    });
  }

  // 2 · Give it longer.
  const longer = monthsToTarget({ current, target, monthly, annualRate });
  if (longer !== null && longer > months) {
    ways.push({
      kind: "more_time",
      headline: `Keep this pace and you get there in ${longer} months — ${longer - months} later than planned.`,
      value: longer - months,
      unit: "months",
    });
  }

  // 3 · What growth would have to do, if they assume any. A rate beyond PLAUSIBLE_MAX_RATE is
  //     arithmetically real but not something a plan should lean on, and we say so.
  const rate = requiredRate({ current, target, monthly, months });
  if (rate !== null && rate <= PLAUSIBLE_MAX_RATE) {
    ways.push({
      kind: "let_it_grow",
      headline: `At this pace, the money would have to grow about ${(rate * 100).toFixed(1)}% a year to arrive on time.`,
      value: rate,
      unit: "rate",
    });
  } else {
    ways.push({
      kind: "adjust_goal",
      headline:
        rate === null
          ? "No rate of growth closes this gap on time — the amount or the date has to move."
          : `It would take about ${(rate * 100).toFixed(0)}% growth a year to arrive on time — far beyond what any plan should count on. The amount or the date has to move.`,
      value: rate,
      unit: rate === null ? "none" : "rate",
    });
  }

  // 4 · Move the goal itself.
  ways.push({
    kind: "adjust_goal",
    headline: `Or aim for ${Math.round(projected)} by then, and keep the rest for later.`,
    value: round(projected, 0),
    unit: "currency",
  });

  return { reachable, projected, shortfall, ways };
}

/** Rates offered as starting points. Labels describe volatility, never a product. */
export const RATE_PRESETS: { label: string; rate: number; note: string }[] = [
  { label: "Savings account", rate: 0.0, note: "Money that doesn't move. What you put in is what you get." },
  { label: "Low growth", rate: 0.03, note: "A cautious assumption. Steadier, slower." },
  { label: "Medium growth", rate: 0.06, note: "A middling assumption. Expect ups and downs along the way." },
  { label: "High growth", rate: 0.09, note: "An optimistic assumption. Bigger swings, including down." },
];
