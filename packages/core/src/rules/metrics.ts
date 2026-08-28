import type { FreedomProfile, LifeStage } from "../schema/profile";
import type { Capacity, GoalProjection, Metrics } from "../schema/metrics";
import { monthsBetween } from "../utils/dates";
import { clamp, round } from "../utils/money";

/** Baseline emergency buffer by life stage (months of expenses). */
export function emergencyTargetMonths(lifeStage: LifeStage): number {
  switch (lifeStage) {
    case "student":
      return 2;
    case "parent":
      return 4;
    default:
      return 3;
  }
}

export function capacityFor(savingsRate: number | null): Capacity {
  if (savingsRate === null || savingsRate <= 0) return "none";
  if (savingsRate < 0.1) return "tight";
  if (savingsRate < 0.25) return "steady";
  return "strong";
}

/**
 * Every number the product shows or reasons about, computed deterministically.
 * The LLM receives these as facts and never does this arithmetic itself.
 */
export function computeMetrics(profile: FreedomProfile, opts: { now?: Date } = {}): Metrics {
  const now = opts.now ?? new Date();
  const { monthlyIncome: income, monthlyExpenses: expenses, savings, debt } = profile;

  const surplus = round(income - expenses, 2);
  const savingsRate = income > 0 ? round(surplus / income, 4) : null;

  const targetMonths = emergencyTargetMonths(profile.lifeStage);
  const emergencyTarget = round(targetMonths * expenses, 2);
  const emergencyMonths = expenses > 0 ? round(savings / expenses, 2) : null;
  const emergencyGap = round(Math.max(0, emergencyTarget - savings), 2);
  const emergencyProgress = emergencyTarget > 0 ? round(clamp(savings / emergencyTarget, 0, 1), 4) : 1;
  const spareSavings = round(Math.max(0, savings - emergencyTarget), 2);

  const debtToAnnualIncome = debt === 0 ? 0 : income > 0 ? round(debt / (income * 12), 4) : null;
  const monthsToClearDebt = debt === 0 ? 0 : surplus > 0 ? Math.ceil(debt / surplus) : null;

  let spare = spareSavings;
  const goalProjections: GoalProjection[] = [...profile.goals]
    .sort((a, b) => a.priority - b.priority)
    .map((g) => {
      const targetAmount = g.targetAmount ?? null;
      const targetDate = g.targetDate ?? null;
      const monthsUntilDeadline = targetDate ? monthsBetween(now, targetDate) : null;
      if (targetAmount === null) {
        return {
          goalId: g.id,
          label: g.label,
          type: g.type,
          fundedBy: g.fundedBy ?? "savings",
          targetAmount,
          targetDate,
          funded: 0,
          remaining: null,
          monthsToTarget: null,
          monthsUntilDeadline,
          requiredMonthly: null,
          onTrack: null,
        };
      }
      // An explicit per-goal balance wins and doesn't touch the shared pool; otherwise the
      // spare savings waterfall fills goals in priority order.
      const funded =
        g.currentBalance !== undefined
          ? round(Math.min(g.currentBalance, targetAmount), 2)
          : round(Math.min(spare, targetAmount), 2);
      if (g.currentBalance === undefined) spare = round(spare - funded, 2);
      const remaining = round(targetAmount - funded, 2);
      const monthsToTarget = remaining === 0 ? 0 : surplus > 0 ? Math.ceil(remaining / surplus) : null;
      const requiredMonthly =
        remaining === 0
          ? 0
          : monthsUntilDeadline !== null && monthsUntilDeadline > 0
            ? Math.ceil(remaining / monthsUntilDeadline)
            : null;
      const onTrack =
        monthsUntilDeadline === null
          ? null
          : monthsToTarget !== null && monthsToTarget <= monthsUntilDeadline;
      return {
        goalId: g.id,
        label: g.label,
        type: g.type,
        fundedBy: g.fundedBy ?? "savings",
        targetAmount,
        targetDate,
        funded,
        remaining,
        monthsToTarget,
        monthsUntilDeadline,
        requiredMonthly,
        onTrack,
      };
    });

  return {
    currency: profile.currency,
    monthlyIncome: income,
    monthlyExpenses: expenses,
    savings,
    debt,
    surplus,
    savingsRate,
    emergencyTargetMonths: targetMonths,
    emergencyTarget,
    emergencyMonths,
    emergencyGap,
    emergencyProgress,
    spareSavings,
    debtToAnnualIncome,
    monthsToClearDebt,
    capacity: capacityFor(savingsRate),
    goalProjections,
  };
}
