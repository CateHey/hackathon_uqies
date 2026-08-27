import { z } from "zod";
import { StepStatus } from "./plan";

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
