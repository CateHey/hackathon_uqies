import {
  computeMetrics,
  exploreFutures,
  growthGoalNote,
  payYourselfPlan,
  SaveResponse,
  type FreedomProfile,
  type SaveRequest,
  type SaveResponse as SaveResponseT,
} from "@free-me/core";

/**
 * Everything the Pay Yourself First screen needs, computed fresh from the profile.
 *
 * It is deliberately not cached: the whole engine is pure functions costing well under a
 * millisecond, and recomputing means reordering or excluding a goal can never show stale
 * numbers. Only history is stored.
 */
export function buildSave(profile: FreedomProfile, req: SaveRequest = {}, now = new Date()): SaveResponseT {
  const metrics = computeMetrics(profile, { now });
  const pay = payYourselfPlan(profile, metrics, {
    now,
    monthlyTotal: req.monthlyTotal,
    annualRate: req.annualRate,
    excludeGoalIds: req.excludeGoalIds,
  });
  const excluded = new Set(req.excludeGoalIds ?? []);
  const annualRate = req.annualRate ?? 0;

  const goals = metrics.goalProjections.map((g) => {
    const goal = profile.goals.find((x) => x.id === g.goalId);
    const line = pay.lines.find((l) => l.goalId === g.goalId);
    const monthly = line?.amount ?? 0;
    const months = g.monthsUntilDeadline;
    const base = {
      goalId: g.goalId,
      label: g.label,
      emoji: goal?.emoji,
      fundedBy: g.fundedBy,
      target: g.targetAmount,
      current: g.funded,
      monthsUntilDeadline: months,
      targetDate: g.targetDate,
      monthly,
    };

    // A goal that isn't reached by saving gets an honest note instead of a set of futures.
    if (g.fundedBy === "growth" && g.targetAmount !== null && months !== null) {
      return {
        ...base,
        today: null,
        futures: [],
        growthNote: growthGoalNote({
          target: g.targetAmount,
          current: g.funded,
          months,
          monthlyContribution: monthly,
          annualRate,
        }),
      };
    }

    // Excluded by the scenario switch, or no target/date to work with: nothing to explore.
    if (g.targetAmount === null || months === null || excluded.has(g.goalId)) {
      return { ...base, today: null, futures: [] };
    }

    const { today, futures } = exploreFutures({
      target: g.targetAmount,
      current: g.funded,
      months,
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      savingsRate: profile.monthlyIncome > 0 ? monthly / profile.monthlyIncome : 0,
      annualRate,
      maxSavingsRate: profile.monthlyIncome > 0 ? Math.max(0, 1 - profile.monthlyExpenses / profile.monthlyIncome) : 0,
    });
    return { ...base, today, futures };
  });

  return SaveResponse.parse({
    currency: profile.currency,
    monthlyIncome: profile.monthlyIncome,
    surplus: metrics.surplus,
    pay,
    goals,
  });
}
