import { lessonSummaries, type LessonSummary } from "@free-me/content";
import type { SystemBlock } from "./client";
import { PLAN_SYSTEM_PROMPT } from "./prompts";

/** The catalogue in a stable order, so the cached prompt prefix is byte-identical across requests. */
export function getCatalogue(): LessonSummary[] {
  return [...lessonSummaries()].sort((a, b) => a.id.localeCompare(b.id));
}

export function catalogueBlock(catalogue: LessonSummary[] = getCatalogue()): string {
  const sorted = [...catalogue].sort((a, b) => a.id.localeCompare(b.id));
  return `# Lesson catalogue\nUse ONLY these ids in lessonIds.\n${JSON.stringify(sorted)}`;
}

/** System prompt + catalogue as two blocks, with the cache breakpoint on the last stable block. */
export function planSystemBlocks(catalogue?: LessonSummary[]): SystemBlock[] {
  return [
    { type: "text", text: PLAN_SYSTEM_PROMPT },
    { type: "text", text: catalogueBlock(catalogue), cache_control: { type: "ephemeral" } },
  ];
}
