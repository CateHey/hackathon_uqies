export {
  MODEL,
  createAnthropicClient,
  estimateCostUsd,
  zeroUsage,
  addUsage,
  type AiClient,
  type Effort,
  type StructuredCall,
  type StructuredResult,
  type SystemBlock,
  type TextCall,
  type Usage,
} from "./client";
export { getCatalogue, catalogueBlock, planSystemBlocks } from "./catalogue";
export { generatePlan, type GenerateOptions, type GenerateResult } from "./generate-plan";
export { explain, findPlanItem, NotFoundError, type ExplainInput, type ExplainResult } from "./explain";
export {
  allocate,
  eligibleBuckets,
  ruleAllocation,
  allocationProblems,
  FLEXIBLE_KEY,
  type AllocateInput,
  type AllocateResult,
  type EligibleBucket,
} from "./allocate";
export { personaliseLesson, gateParagraphs, OMITTED_PARAGRAPH, type PersonaliseInput } from "./personalise-lesson";
export { postValidate, assertValid, findBannedTerms, containsBannedTerms, ValidationError, BANNED_PATTERNS } from "./validate";
export { PLAN_SYSTEM_PROMPT, EXPLAIN_SYSTEM_PROMPT, ALLOCATE_SYSTEM_PROMPT, LESSON_SYSTEM_PROMPT } from "./prompts";
