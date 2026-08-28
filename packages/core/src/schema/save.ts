import { z } from "zod";
import { FundedBy } from "./profile";

/**
 * Wire shapes for the Pay Yourself First screen.
 *
 * These mirror the return types of `rules/pay-yourself.ts` and `rules/futures.ts`. The TypeScript
 * types stay with the engines (they are the source of truth); these carry a `Schema` suffix so the
 * two can live side by side, and a test parses real engine output through them so they can't drift.
 */

export const WaySchema = z.object({
  kind: z.enum(["on_track", "save_more", "more_time", "let_it_grow", "adjust_goal"]),
  headline: z.string(),
  value: z.number().nullable(),
  unit: z.enum(["currency_per_month", "months", "rate", "currency", "none"]),
});

export const WaysSchema = z.object({
  reachable: z.boolean(),
  projected: z.number(),
  shortfall: z.number(),
  ways: z.array(WaySchema),
});

export const PayYourselfLineSchema = z.object({
  key: z.string(),
  kind: z.enum(["buffer", "goal", "flexible"]),
  label: z.string(),
  amount: z.number(),
  reason: z.string(),
  goalId: z.string().optional(),
  target: z.number().optional(),
  current: z.number().optional(),
  monthsToTarget: z.number().nullable(),
  monthsUntilDeadline: z.number().nullable(),
  onTrack: z.boolean().nullable(),
  ways: WaysSchema.optional(),
});

export const PayYourselfPlanSchema = z.object({
  currency: z.string(),
  monthlyTotal: z.number(),
  shareOfIncome: z.number(),
  lines: z.array(PayYourselfLineSchema),
  unfunded: z.array(z.object({ goalId: z.string(), label: z.string(), reason: z.string() })),
  growthGoals: z.array(
    z.object({ goalId: z.string(), label: z.string(), target: z.number().nullable(), reason: z.string() }),
  ),
  annualRate: z.number(),
});

export const FutureLeversSchema = z.object({
  monthlyIncome: z.number(),
  monthlyExpenses: z.number(),
  savingsRate: z.number(),
  annualRaise: z.number(),
  annualRate: z.number(),
  months: z.number(),
});

export const FutureOutcomeSchema = z.object({
  finalBalance: z.number(),
  reaches: z.boolean(),
  monthsToTarget: z.number().nullable(),
  firstMonthly: z.number(),
  lastMonthly: z.number(),
  totalContributed: z.number(),
});

export const FutureSchema = z.object({
  kind: z.enum(["today", "save_more", "earn_more", "grow_income", "more_time", "out_of_reach"]),
  title: z.string(),
  headline: z.string(),
  levers: FutureLeversSchema,
  outcome: FutureOutcomeSchema,
  works: z.boolean(),
  stretch: z.number(),
});

/** One goal, with today's path and every honest way to change it. */
export const GoalFuturesSchema = z.object({
  goalId: z.string(),
  label: z.string(),
  emoji: z.string().optional(),
  fundedBy: FundedBy,
  target: z.number().nullable(),
  current: z.number(),
  monthsUntilDeadline: z.number().nullable(),
  targetDate: z.string().nullable(),
  /** Monthly amount this goal gets in the current split. */
  monthly: z.number(),
  today: FutureSchema.nullable(),
  futures: z.array(FutureSchema),
  /** Set only for goals saving can't reach on its own. */
  growthNote: z.object({ fromSaving: z.number(), gap: z.number(), headline: z.string() }).optional(),
});
export type GoalFutures = z.infer<typeof GoalFuturesSchema>;

export const SaveRequest = z.object({
  /** Override what they pay themselves each month. */
  monthlyTotal: z.number().int().nonnegative().max(1_000_000).optional(),
  /** Assumed annual growth, 0–0.12. The person chooses it; it is never a recommendation. */
  annualRate: z.number().min(0).max(0.12).optional(),
  /** The scenario switch: goals left out of this split. */
  excludeGoalIds: z.array(z.string()).max(10).optional(),
});
export type SaveRequest = z.infer<typeof SaveRequest>;

export const SaveResponse = z.object({
  currency: z.string(),
  monthlyIncome: z.number(),
  surplus: z.number(),
  pay: PayYourselfPlanSchema,
  goals: z.array(GoalFuturesSchema),
});
export type SaveResponse = z.infer<typeof SaveResponse>;

/** What can be edited on a goal from the vision board. */
export const GoalPatch = z.object({
  currentBalance: z.number().nonnegative().max(100_000_000).optional(),
  emoji: z.string().max(8).optional(),
  targetAmount: z.number().nonnegative().max(100_000_000).optional(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type GoalPatch = z.infer<typeof GoalPatch>;
