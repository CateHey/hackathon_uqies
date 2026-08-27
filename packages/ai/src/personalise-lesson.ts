import type { FreedomPlan, FreedomProfile, Metrics } from "@free-me/core";
import type { Lesson } from "@free-me/content";
import type { AiClient } from "./client";
import { LESSON_SYSTEM_PROMPT } from "./prompts";
import { containsBannedTerms } from "./validate";

export interface PersonaliseInput {
  lesson: Lesson;
  profile: FreedomProfile;
  plan: FreedomPlan;
  metrics: Metrics;
}

export const OMITTED_PARAGRAPH = "_(A paragraph was left out because it read like advice rather than education.)_";

/**
 * Streams a lesson rewritten for one person. Paragraphs are buffered and checked
 * against the banned-terms gate before they are released, so nothing that reads
 * like advice reaches the screen mid-stream.
 */
export async function* personaliseLesson(input: PersonaliseInput, opts: { client: AiClient }): AsyncIterable<string> {
  const user = JSON.stringify({
    lesson: { id: input.lesson.id, title: input.lesson.title, level: input.lesson.level, body: input.lesson.body },
    knowledge: input.profile.knowledge,
    freedomStatement: input.profile.freedomStatement,
    goals: input.profile.goals.map((g) => ({ type: g.type, label: g.label, targetAmount: g.targetAmount })),
    currency: input.profile.currency,
    profileSummary: input.plan.profileSummary,
    metrics: {
      surplus: input.metrics.surplus,
      savings: input.metrics.savings,
      emergencyTarget: input.metrics.emergencyTarget,
      emergencyGap: input.metrics.emergencyGap,
      capacity: input.metrics.capacity,
    },
  });

  const stream = opts.client.streamText({
    system: [{ type: "text", text: LESSON_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    user,
    effort: "medium",
    maxTokens: 4000,
  });

  yield* gateParagraphs(stream);
}

/** Split a text stream on blank lines and release each paragraph only once it passes the gate. */
export async function* gateParagraphs(stream: AsyncIterable<string>): AsyncIterable<string> {
  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk;
    let idx = buffer.indexOf("\n\n");
    while (idx !== -1) {
      const paragraph = buffer.slice(0, idx + 2);
      buffer = buffer.slice(idx + 2);
      yield containsBannedTerms(paragraph) ? `${OMITTED_PARAGRAPH}\n\n` : paragraph;
      idx = buffer.indexOf("\n\n");
    }
  }
  if (buffer.length) yield containsBannedTerms(buffer) ? OMITTED_PARAGRAPH : buffer;
}
