import { z } from "zod";

/**
 * The Freedom Plan is the single canonical object. Explore mode and Professional
 * mode are two renderers of it. Nothing here is mode-specific.
 *
 * Numeric ranges (relevance 1–5, progress 0–1) are deliberately NOT encoded as Zod
 * min/max here: this schema is also handed to the model as a structured-output
 * format, and range keywords are not supported there. Ranges are enforced in
 * packages/ai/src/validate.ts.
 */

export const RegionType = z.enum([
  "foundation",
  "security",
  "growth",
  "markets",
  "property",
  "business",
  "digital_assets",
  "personal_goal",
  "freedom_city",
]);
export type RegionType = z.infer<typeof RegionType>;

export const RegionStatus = z.enum(["locked", "available", "active", "complete"]);
export type RegionStatus = z.infer<typeof RegionStatus>;

export const Region = z.object({
  id: z.string(),
  type: RegionType,
  /** 🎮 "Foundation Village" */
  exploreTitle: z.string(),
  /** 📊 "Financial foundations" */
  proTitle: z.string(),
  summary: z.string(),
  /** Why this region matters for THIS user, in plain language. */
  why: z.string(),
  /** 1–5 star relevance for path exploration. */
  relevance: z.number().int(),
  status: RegionStatus,
  /** 0–1 */
  progress: z.number(),
  stepIds: z.array(z.string()),
  /** Must exist in the lesson catalogue. */
  lessonIds: z.array(z.string()),
  /** Set for regions that represent one of the user's goals. */
  goalId: z.string().optional(),
});
export type Region = z.infer<typeof Region>;

export const BridgeStatus = z.enum(["locked", "unlocked"]);
export type BridgeStatus = z.infer<typeof BridgeStatus>;

export const Bridge = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  status: BridgeStatus,
  /** Human-readable requirement: "Complete 'Build your emergency buffer'". */
  requirement: z.string(),
  /** Machine-readable requirement: the bridge unlocks when all of these steps are done. Empty = when `from` is complete. */
  requiredStepIds: z.array(z.string()),
  /** How the two areas affect each other: "Money into investments slows your deposit goal". */
  relationship: z.string(),
  why: z.string(),
});
export type Bridge = z.infer<typeof Bridge>;

export const StepKind = z.enum(["learn", "save", "action", "review"]);
export type StepKind = z.infer<typeof StepKind>;

export const StepStatus = z.enum(["todo", "in_progress", "done"]);
export type StepStatus = z.infer<typeof StepStatus>;

export const StepMetric = z.object({
  label: z.string(),
  current: z.number(),
  target: z.number(),
  /** "AUD" | "months" | "%" */
  unit: z.string(),
});
export type StepMetric = z.infer<typeof StepMetric>;

export const Step = z.object({
  id: z.string(),
  regionId: z.string(),
  kind: StepKind,
  title: z.string(),
  description: z.string(),
  why: z.string(),
  metric: StepMetric.optional(),
  status: StepStatus,
  order: z.number().int(),
});
export type Step = z.infer<typeof Step>;

export const FreedomCity = z.object({
  title: z.string(),
  pillars: z.array(z.string()),
  narrative: z.string(),
});
export type FreedomCity = z.infer<typeof FreedomCity>;

export const ProfileSummary = z.object({
  headline: z.string(),
  tags: z.array(z.string()),
});
export type ProfileSummary = z.infer<typeof ProfileSummary>;

/** What the model produces. Provenance fields are added by code (see FreedomPlan). */
export const PlanOutput = z.object({
  profileSummary: ProfileSummary,
  currentPriorityRegionId: z.string(),
  nextStepId: z.string(),
  regions: z.array(Region),
  bridges: z.array(Bridge),
  steps: z.array(Step),
  freedomCity: FreedomCity,
  disclaimers: z.array(z.string()),
});
export type PlanOutput = z.infer<typeof PlanOutput>;

export const PlanSource = z.enum(["ai", "template"]);
export type PlanSource = z.infer<typeof PlanSource>;

export const FreedomPlan = PlanOutput.extend({
  version: z.number().int(),
  source: PlanSource,
  /** ISO timestamp */
  generatedAt: z.string(),
});
export type FreedomPlan = z.infer<typeof FreedomPlan>;

export { DISCLAIMER } from "../brand";
