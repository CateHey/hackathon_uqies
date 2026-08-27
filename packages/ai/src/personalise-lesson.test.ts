import { describe, expect, it } from "vitest";
import { computeMetrics, FIXTURE_NOW, fixtures, templatePlan } from "@free-me/core";
import type { Lesson } from "@free-me/content";
import { gateParagraphs, OMITTED_PARAGRAPH, personaliseLesson } from "./personalise-lesson";
import { fakeClient } from "./testing/fake-client";

const lesson: Lesson = {
  id: "emergency-fund",
  title: "Your emergency buffer",
  level: "beginner",
  topics: ["saving"],
  readingMinutes: 3,
  summary: "Why a buffer matters.",
  body: "## Why\n\nA buffer absorbs surprises.\n\n## What this means for you\n\nStart small.",
  quickCheck: [{ question: "q", answer: "a" }],
};

const collect = async (it: AsyncIterable<string>) => {
  let out = "";
  for await (const chunk of it) out += chunk;
  return out;
};

const ctx = () => {
  const metrics = computeMetrics(fixtures.sarah, { now: FIXTURE_NOW });
  const plan = templatePlan(fixtures.sarah, metrics, { now: FIXTURE_NOW });
  return { lesson, plan, metrics, profile: fixtures.sarah };
};

describe("gateParagraphs", () => {
  it("re-assembles chunks into paragraphs", async () => {
    async function* src() {
      yield "Hello ";
      yield "world.\n\nSecond ";
      yield "para.";
    }
    expect(await collect(gateParagraphs(src()))).toBe("Hello world.\n\nSecond para.");
  });

  it("omits a paragraph that reads like advice, even when split across chunks", async () => {
    async function* src() {
      yield "Fine.\n\nYou should bu";
      yield "y shares from Vanguard.\n\nAlso fine.";
    }
    const out = await collect(gateParagraphs(src()));
    expect(out).toBe(`Fine.\n\n${OMITTED_PARAGRAPH}\n\nAlso fine.`);
    expect(out).not.toMatch(/Vanguard/);
  });

  it("gates the trailing paragraph too", async () => {
    async function* src() {
      yield "Fine.\n\nput it all in bitcoin";
    }
    expect(await collect(gateParagraphs(src()))).toBe(`Fine.\n\n${OMITTED_PARAGRAPH}`);
  });
});

describe("personaliseLesson", () => {
  it("streams the rewritten lesson and sends the right context", async () => {
    const { client, calls } = fakeClient({ stream: ["## Why\n\nFor your $6,000 Japan trip, ", "a buffer matters.\n\n## What this means for you\n\nYou."] });
    const out = await collect(personaliseLesson(ctx(), { client }));
    expect(out).toMatch(/Japan trip/);
    expect(calls.stream[0]!.effort).toBe("medium");
    const user = JSON.parse(calls.stream[0]!.user) as { lesson: { id: string }; knowledge: string; currency: string; goals: { label: string }[] };
    expect(user.lesson.id).toBe("emergency-fund");
    expect(user.knowledge).toBe("beginner");
    expect(user.currency).toBe("AUD");
    expect(user.goals[0]?.label).toBe("Trip to Japan");
  });
});
