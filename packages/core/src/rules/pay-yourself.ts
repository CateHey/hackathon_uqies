import type { FreedomProfile } from "../schema/profile";
import type { Metrics } from "../schema/metrics";
import { formatMoney, round } from "../utils/money";
import { monthsToTarget, requiredMonthly, waysToGetThere, type Ways } from "./growth";

/**
 * Pay Yourself First.
 *
 * Before anything else is spent, a share of income goes to the person's own goals. This
 * module decides that share and splits it — deterministically, so every dollar can be
 * explained. Order: the safety net first, then goals by how urgent their deadline makes
 * them, then whatever is left stays flexible.
 */

export type LineKind = "buffer" | "goal" | "flexible";

export interface PayYourselfLine {
  /** "buffer", a goal id, or "flexible". */
  key: string;
  kind: LineKind;
  label: string;
  /** Monthly amount, whole units. */
  amount: number;
  reason: string;
  goalId?: string;
  /** What this line is working towards, when it has a target. */
  target?: number;
  current?: number;
  /** Months to reach the target at this amount. */
  monthsToTarget: number | null;
  monthsUntilDeadline: number | null;
  onTrack: boolean | null;
  /** Every honest route to the target at this amount — see growth.ts. */
  ways?: Ways;
}

export interface PayYourselfPlan {
  currency: string;
  /** What they pay themselves each month, in total. */
  monthlyTotal: number;
  /** Share of income that goes to themselves first. */
  shareOfIncome: number;
  lines: PayYourselfLine[];
  /** Goals that received nothing this month, in priority order. */
  unfunded: { goalId: string; label: string; reason: string }[];
  /**
   * Goals that don't get a monthly line because saving isn't how they happen — a business,
   * equity, income growth. Kept visible so the plan never pretends they're funded.
   */
  growthGoals: { goalId: string; label: string; target: number | null; reason: string }[];
  /** The growth assumption used, 0 for plain saving. */
  annualRate: number;
}

export interface PayYourselfOptions {
  /** Override what they pay themselves. Defaults to the whole monthly surplus. */
  monthlyTotal?: number;
  /** Assumed annual growth for goal projections. Chosen by the person; 0 by default. */
  annualRate?: number;
  /** Goals to leave out of this month's split — the scenario switch. */
  excludeGoalIds?: string[];
  now?: Date;
}

/** Whole dollars, never negative. */
const whole = (n: number) => Math.max(0, Math.round(n));

export function payYourselfPlan(
  profile: FreedomProfile,
  metrics: Metrics,
  opts: PayYourselfOptions = {},
): PayYourselfPlan {
  const annualRate = opts.annualRate ?? 0;
  const excluded = new Set(opts.excludeGoalIds ?? []);
  const monthlyTotal = whole(opts.monthlyTotal ?? Math.max(0, metrics.surplus));
  const money = (n: number) => formatMoney(n, profile.currency);
  const lines: PayYourselfLine[] = [];
  const unfunded: PayYourselfPlan["unfunded"] = [];
  const growthGoals: PayYourselfPlan["growthGoals"] = [];
  let left = monthlyTotal;

  // ---------------------------------------------------------------- 1 · the safety net
  if (metrics.emergencyGap > 0 && left > 0) {
    // Close the gap inside a year if that fits, but never eat more than half the split.
    const ideal = Math.ceil(metrics.emergencyGap / 12);
    const amount = whole(Math.min(left, Math.max(Math.min(ideal, left), Math.min(left, Math.round(monthlyTotal * 0.2))), Math.round(monthlyTotal * 0.5)));
    if (amount > 0) {
      lines.push({
        key: "buffer",
        kind: "buffer",
        label: "Safety net",
        amount,
        reason: `You're ${money(metrics.emergencyGap)} short of a ${metrics.emergencyTargetMonths}-month buffer. This closes it in about ${Math.ceil(metrics.emergencyGap / amount)} months, so a surprise can't derail the rest.`,
        target: metrics.emergencyTarget,
        current: round(metrics.emergencyTarget - metrics.emergencyGap, 2),
        monthsToTarget: Math.ceil(metrics.emergencyGap / amount),
        monthsUntilDeadline: null,
        onTrack: null,
      });
      left -= amount;
    }
  }

  // ---------------------------------------------------------------- 2 · the goals
  // A "growth" goal is never given a monthly line: a business or equity target isn't reached by
  // putting money aside, and pretending otherwise would swallow the budget of the goals that are.
  for (const g of metrics.goalProjections) {
    if (excluded.has(g.goalId) || g.fundedBy !== "growth") continue;
    growthGoals.push({
      goalId: g.goalId,
      label: g.label,
      target: g.targetAmount,
      reason:
        "This one isn't reached by saving — it comes from what you build. It stays on the plan, but it doesn't take a slice of this month.",
    });
  }

  const goals = metrics.goalProjections
    .filter((g) => !excluded.has(g.goalId) && g.targetAmount !== null && g.fundedBy !== "growth")
    .map((g) => {
      const months = g.monthsUntilDeadline;
      const need =
        months && months > 0
          ? (requiredMonthly({ current: g.funded, target: g.targetAmount ?? 0, months, annualRate }) ?? 0)
          : null;
      return { g, months, need };
    });

  // Goals with a deadline come first, soonest first; then the rest in priority order.
  const ordered = [...goals].sort((a, b) => {
    if (a.months !== null && b.months !== null) return a.months - b.months;
    if (a.months !== null) return -1;
    if (b.months !== null) return 1;
    return 0;
  });

  const totalNeed = ordered.reduce((sum, o) => sum + (o.need ?? 0), 0);
  const budgetForGoals = left;
  const scarce = totalNeed > budgetForGoals && totalNeed > 0;

  for (const { g, months, need } of ordered) {
    if (left <= 0) {
      unfunded.push({
        goalId: g.goalId,
        label: g.label,
        reason: "Nothing left this month once the goals above are funded. It gets its turn as they finish.",
      });
      continue;
    }
    if (g.remaining === 0) {
      unfunded.push({ goalId: g.goalId, label: g.label, reason: "Already funded — nothing more needed." });
      continue;
    }

    // Enough for everyone: each goal gets exactly what its deadline needs.
    // Not enough: share what's left in proportion to what each goal needs.
    const share = scarce && totalNeed > 0 ? (need ?? 0) / totalNeed : 1;
    const wanted = need === null ? Math.round(left / Math.max(1, ordered.length)) : scarce ? Math.round(budgetForGoals * share) : need;
    const amount = whole(Math.min(left, wanted));
    if (amount === 0) {
      unfunded.push({ goalId: g.goalId, label: g.label, reason: "Not enough left to make a difference this month." });
      continue;
    }

    const ways = waysToGetThere({
      target: g.targetAmount ?? 0,
      current: g.funded,
      monthly: amount,
      months,
      annualRate,
      maxMonthly: monthlyTotal,
    });
    const reach = monthsToTarget({ current: g.funded, target: g.targetAmount ?? 0, monthly: amount, annualRate });

    lines.push({
      key: g.goalId,
      kind: "goal",
      label: g.label,
      amount,
      goalId: g.goalId,
      target: g.targetAmount ?? undefined,
      current: g.funded,
      monthsToTarget: reach,
      monthsUntilDeadline: months,
      onTrack: months === null ? null : ways.reachable,
      ways,
      reason:
        months === null
          ? `${money(amount)} a month gets you to ${money(g.targetAmount ?? 0)} in about ${reach ?? "—"} months.`
          : ways.reachable
            ? `${money(amount)} a month lands ${money(g.targetAmount ?? 0)} by your date with room to spare.`
            : `${money(amount)} a month is what's spare for this — it reaches ${money(ways.projected)} of ${money(g.targetAmount ?? 0)} by then. See what would close the gap.`,
    });
    left -= amount;
  }

  // ---------------------------------------------------------------- 3 · what's left
  if (left > 0) {
    lines.push({
      key: "flexible",
      kind: "flexible",
      label: "Flexible",
      amount: whole(left),
      reason: "Yours, unassigned. Life happens, and a plan with no slack is a plan you abandon.",
      monthsToTarget: null,
      monthsUntilDeadline: null,
      onTrack: null,
    });
    left = 0;
  }

  // Rounding can leave the lines a dollar or two off; put the difference on the biggest line.
  const sum = lines.reduce((s, l) => s + l.amount, 0);
  if (sum !== monthlyTotal && lines.length > 0) {
    const biggest = lines.reduce((a, b) => (b.amount > a.amount ? b : a));
    biggest.amount = whole(biggest.amount + (monthlyTotal - sum));
  }

  return {
    currency: profile.currency,
    monthlyTotal,
    shareOfIncome: profile.monthlyIncome > 0 ? round(monthlyTotal / profile.monthlyIncome, 4) : 0,
    lines,
    unfunded,
    growthGoals,
    annualRate,
  };
}

/**
 * The scenario switch: what changes if a goal is dropped or added back.
 * "Take out the car, and the master's arrives seven months sooner."
 */
export interface ScenarioDelta {
  goalId: string;
  label: string;
  /** Monthly amount before and after. */
  before: number;
  after: number;
  monthsBefore: number | null;
  monthsAfter: number | null;
  /** Negative means it arrives sooner. */
  monthsSaved: number | null;
}

export function compareScenarios(
  profile: FreedomProfile,
  metrics: Metrics,
  base: PayYourselfOptions,
  variant: PayYourselfOptions,
): { base: PayYourselfPlan; variant: PayYourselfPlan; deltas: ScenarioDelta[] } {
  const a = payYourselfPlan(profile, metrics, base);
  const b = payYourselfPlan(profile, metrics, variant);
  const byKey = (p: PayYourselfPlan) => new Map(p.lines.map((l) => [l.key, l]));
  const aLines = byKey(a);
  const bLines = byKey(b);

  const keys = new Set([...aLines.keys(), ...bLines.keys()].filter((k) => k !== "flexible"));
  const deltas: ScenarioDelta[] = [];
  for (const key of keys) {
    const before = aLines.get(key);
    const after = bLines.get(key);
    deltas.push({
      goalId: key,
      label: after?.label ?? before?.label ?? key,
      before: before?.amount ?? 0,
      after: after?.amount ?? 0,
      monthsBefore: before?.monthsToTarget ?? null,
      monthsAfter: after?.monthsToTarget ?? null,
      monthsSaved:
        before?.monthsToTarget != null && after?.monthsToTarget != null
          ? after.monthsToTarget - before.monthsToTarget
          : null,
    });
  }
  deltas.sort((x, y) => (x.monthsSaved ?? 0) - (y.monthsSaved ?? 0));
  return { base: a, variant: b, deltas };
}
