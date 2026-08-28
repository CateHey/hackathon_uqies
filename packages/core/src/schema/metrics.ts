import { z } from "zod";
import { GoalType } from "./profile";

/** How much room the person has to save each month, derived from their savings rate. */
export const Capacity = z.enum(["none", "tight", "steady", "strong"]);
export type Capacity = z.infer<typeof Capacity>;

export const GoalProjection = z.object({
  goalId: z.string(),
  label: z.string(),
  type: GoalType,
  targetAmount: z.number().nullable(),
  targetDate: z.string().nullable(),
  /** Savings already available for this goal (spare savings beyond the emergency target, applied in priority order). */
  funded: z.number(),
  remaining: z.number().nullable(),
  /** Months to reach the target at the current monthly surplus. null = no surplus, so never at this rate. */
  monthsToTarget: z.number().nullable(),
  monthsUntilDeadline: z.number().nullable(),
  /** Monthly saving needed to hit the deadline. */
  requiredMonthly: z.number().nullable(),
  /** null when there is no deadline to be on track for. */
  onTrack: z.boolean().nullable(),
});
export type GoalProjection = z.infer<typeof GoalProjection>;

/** Every number the product shows or reasons about. Computed by the rules engine, never by the model. */
export const Metrics = z.object({
  currency: z.string(),
  monthlyIncome: z.number(),
  monthlyExpenses: z.number(),
  savings: z.number(),
  debt: z.number(),
  /** income − expenses (may be negative) */
  surplus: z.number(),
  /** surplus ÷ income; null when there is no income */
  savingsRate: z.number().nullable(),
  emergencyTargetMonths: z.number(),
  emergencyTarget: z.number(),
  /** savings ÷ monthly expenses; null when expenses are zero */
  emergencyMonths: z.number().nullable(),
  emergencyGap: z.number(),
  /** 0–1 */
  emergencyProgress: z.number(),
  /** savings beyond the emergency target */
  spareSavings: z.number(),
  /** debt ÷ annual income; 0 when debt-free; null when there is debt but no income */
  debtToAnnualIncome: z.number().nullable(),
  /** months to clear debt using the whole surplus; 0 when debt-free; null when there is no surplus */
  monthsToClearDebt: z.number().nullable(),
  capacity: Capacity,
  goalProjections: z.array(GoalProjection),
});
export type Metrics = z.infer<typeof Metrics>;
