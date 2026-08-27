import { z } from "zod";
import { FreedomPlan, PlanSource, StepStatus } from "./plan";
import { FreedomProfile } from "./profile";
import { Metrics } from "./metrics";

/** A progress update from the user. Applied deterministically by the rules engine. */
export const ProgressEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("step_status"), stepId: z.string(), status: StepStatus }),
  z.object({ type: z.literal("step_metric"), stepId: z.string(), current: z.number().nonnegative() }),
]);
export type ProgressEvent = z.infer<typeof ProgressEvent>;

export const WhyRequest = z.object({
  itemType: z.enum(["region", "bridge", "step"]),
  itemId: z.string(),
});
export type WhyRequest = z.infer<typeof WhyRequest>;

/** What the model produces for "Why?". */
export const WhyResponse = z.object({ explanation: z.string() });
export type WhyResponse = z.infer<typeof WhyResponse>;

export const AllocationRequest = z.object({
  amount: z.number().int().positive().max(10_000_000),
});
export type AllocationRequest = z.infer<typeof AllocationRequest>;

export const AllocationBucket = z.object({
  /** A region id, or "flexible" for unallocated savings. */
  key: z.string(),
  label: z.string(),
  amount: z.number().int(),
  reason: z.string(),
});
export type AllocationBucket = z.infer<typeof AllocationBucket>;

/** What the model produces for an allocation. */
export const AllocationOutput = z.object({
  buckets: z.array(AllocationBucket),
  summary: z.string(),
});
export type AllocationOutput = z.infer<typeof AllocationOutput>;

export const Allocation = AllocationOutput.extend({ amount: z.number().int() });
export type Allocation = z.infer<typeof Allocation>;

export const ApiError = z.object({ code: z.string(), message: z.string() });
export type ApiError = z.infer<typeof ApiError>;

// ---------------------------------------------------------------- API payloads
// Every route validates its input and output with these; the api-client validates responses again.

export const PlanMode = z.enum(["ai", "template", "demo"]);
export type PlanMode = z.infer<typeof PlanMode>;

export const PlanBundle = z.object({
  profile: FreedomProfile,
  plan: FreedomPlan,
  metrics: Metrics,
});
export type PlanBundle = z.infer<typeof PlanBundle>;

export const GenerateResponse = PlanBundle.extend({
  source: PlanSource,
  attempts: z.number().int(),
  mode: PlanMode,
  /** true when a personalised (AI) plan is being built in the background and will replace this one. */
  pending: z.boolean(),
});
export type GenerateResponse = z.infer<typeof GenerateResponse>;

/** Progress of the background personalisation started by /plan/generate. */
export const PlanStatusResponse = z.object({
  pending: z.boolean(),
  upgradeReady: z.boolean(),
  /** Progress events the user has made since the current plan was created. */
  eventsSince: z.number().int(),
  startedAt: z.string().nullable(),
  error: z.string().nullable(),
});
export type PlanStatusResponse = z.infer<typeof PlanStatusResponse>;

export const ProfileResponse = z.object({ ok: z.literal(true), profile: FreedomProfile });
export type ProfileResponse = z.infer<typeof ProfileResponse>;

export const WhyApiResponse = WhyResponse.extend({ source: z.enum(["ai", "plan"]) });
export type WhyApiResponse = z.infer<typeof WhyApiResponse>;

export const AllocateApiResponse = z.object({
  allocation: Allocation,
  source: z.enum(["ai", "rules"]),
});
export type AllocateApiResponse = z.infer<typeof AllocateApiResponse>;

export const ProgressResponse = z.object({
  plan: FreedomPlan,
  metrics: Metrics,
  unlockedBridgeIds: z.array(z.string()),
  completedRegionIds: z.array(z.string()),
});
export type ProgressResponse = z.infer<typeof ProgressResponse>;

export const LessonLevel = z.enum(["beginner", "intermediate", "advanced"]);
export const LessonPayload = z.object({
  id: z.string(),
  title: z.string(),
  level: LessonLevel,
  topics: z.array(z.string()),
  readingMinutes: z.number(),
  summary: z.string(),
  body: z.string(),
  quickCheck: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type LessonPayload = z.infer<typeof LessonPayload>;

export const HealthResponse = z.object({ ok: z.boolean(), mode: PlanMode, version: z.string() });
export type HealthResponse = z.infer<typeof HealthResponse>;

export const DemoName = z.enum(["sarah", "userA", "userB", "debtHeavy", "zeroIncome"]);
export type DemoName = z.infer<typeof DemoName>;
