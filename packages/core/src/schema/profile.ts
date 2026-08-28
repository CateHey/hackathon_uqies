import { z } from "zod";

export const GoalType = z.enum([
  "travel",
  "home",
  "education",
  "business",
  "security",
  "investing",
  "passive_income",
  "early_retirement",
  "other",
]);
export type GoalType = z.infer<typeof GoalType>;

export const LifeStage = z.enum(["student", "early_career", "professional", "parent", "other"]);
export type LifeStage = z.infer<typeof LifeStage>;

export const Knowledge = z.enum(["beginner", "intermediate", "advanced"]);
export type Knowledge = z.infer<typeof Knowledge>;

export const RiskPreference = z.enum(["conservative", "moderate", "high"]);
export type RiskPreference = z.infer<typeof RiskPreference>;

/**
 * How a goal actually gets funded.
 * - "savings"  what you put aside each month gets you there
 * - "growth"   the money comes from a business, equity or income growth — not from saving
 * - "mixed"    savings contribute, but they aren't the whole story
 */
export const FundedBy = z.enum(["savings", "growth", "mixed"]);
export type FundedBy = z.infer<typeof FundedBy>;

export const Goal = z.object({
  id: z.string().min(1),
  type: GoalType,
  label: z.string().min(1).max(80),
  targetAmount: z.number().nonnegative().optional(),
  /**
   * Money already set aside for THIS goal. When set it is used as-is; when absent the rules
   * engine falls back to spreading spare savings across goals in priority order.
   */
  currentBalance: z.number().nonnegative().optional(),
  /** Defaults to "savings". */
  fundedBy: FundedBy.optional(),
  /** Shown on the vision board. */
  emoji: z.string().max(8).optional(),
  /** ISO date, YYYY-MM-DD */
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** 1 = most important */
  priority: z.number().int().min(1),
});
export type Goal = z.infer<typeof Goal>;

/** Everything Free Me knows about a person. Numbers are monthly unless stated. */
export const FreedomProfile = z.object({
  freedomStatement: z.string().min(1).max(500),
  age: z.number().int().min(13).max(100),
  /** ISO 3166-1 alpha-2, e.g. "AU" */
  country: z.string().length(2),
  /** ISO 4217, e.g. "AUD" */
  currency: z.string().length(3),
  lifeStage: LifeStage,
  monthlyIncome: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  savings: z.number().nonnegative(),
  debt: z.number().nonnegative(),
  goals: z.array(Goal).min(1).max(6),
  knowledge: Knowledge,
  risk: RiskPreference,
  /** Free text, e.g. "security before risk" */
  priorities: z.string().max(500).optional(),
});
export type FreedomProfile = z.infer<typeof FreedomProfile>;
