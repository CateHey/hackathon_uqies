import type { FreedomProfile, GoalType, LifeStage } from "../schema/profile";
import { monthsBetween } from "../utils/dates";
import { clamp, round } from "../utils/money";

/** How much room the person has to save each month, derived from their savings rate. */
export type Capacity = "none" | "tight" | "steady" | "strong";

export interface GoalProjection {
  goalId: string;
  label: string;
  type: GoalType;
  targetAmount: number | null;
  targetDate: string | null;
  /** Savings already available for this goal (spare savings beyond the emergency target, applied in priority order). */
  funded: number;
  remaining: number | null;
  /** Months to reach the target at the current monthly surplus. null = no surplus, so never at this rate. */
  monthsToTarget: number | null;
  monthsUntilDeadline: number | null;
  /** Monthly saving needed to hit the deadline. */
  requiredMonthly: number | null;
  /** null when there is no deadline to be on track for. */
  onTrack: boolean | null;
}

export interface Metrics {
  currency: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  debt: number;
  /** income − expenses (may be negative) */
  surplus: number;
  /** surplus ÷ income; null when there is no income */
  savingsRate: number | null;
  emergencyTargetMonths: number;
  emergencyTarget: number;
  /** savings ÷ monthly expenses; null when expenses are zero */
  emergencyMonths: number | null;
  emergencyGap: number;
  /** 0–1 */
  emergencyProgress: number;
  /** savings beyond the emergency target */
  spareSavings: number;
  /** debt ÷ annual income; 0 when debt-free; null when there is debt but no income */
  debtToAnnualIncome: number | null;
  /** months to clear debt using the whole surplus; 0 when debt-free; null when there is no surplus */
  monthsToClearDebt: number | null;
  capacity: Capacity;
  goalProjections: GoalProjection[];
}

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
      const funded = round(Math.min(spare, targetAmount), 2);
      spare = round(spare - funded, 2);
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
