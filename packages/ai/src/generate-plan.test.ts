import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  FIXTURE_NOW,
  fixtures,
  TEMPLATE_LESSON_IDS,
  templatePlan,
  type PlanOutput,
} from "@free-me/core";
import type { LessonSummary } from "@free-me/content";
import { generatePlan } from "./generate-plan";
import { fakeClient } from "./testing/fake-client";

const catalogue: LessonSummary[] = TEMPLATE_LESSON_IDS.map((id) => ({
  id,
  title: id,
  level: "beginner",
  topics: [],
  summary: "",
}));

/** A model-shaped output: the template plan without provenance fields. */
const modelOutput = (): PlanOutput => {
  const metrics = computeMetrics(fixtures.sarah, { now: FIXTURE_NOW });
  const { version: _v, source: _s, generatedAt: _g, ...output } = templatePlan(fixtures.sarah, metrics, { now: FIXTURE_NOW });
  return output;
};

describe("generatePlan", () => {
  it("returns an AI plan on the first valid attempt", async () => {
    const { client, calls } = fakeClient({ structured: [{ output: modelOutput() }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue });

    expect(res.source).toBe("ai");
    expect(res.attempts).toBe(1);
    expect(res.plan.source).toBe("ai");
    expect(res.plan.version).toBe(1);
    expect(res.plan.generatedAt).toBe(FIXTURE_NOW.toISOString());
    expect(res.usage.inputTokens).toBe(100);
    expect(res.plan.regions.filter((r) => r.status === "active")).toHaveLength(1);
    expect(res.metrics.emergencyTarget).toBe(3000);

    const call = calls.structured[0]!;
    expect(call.effort).toBe("high");
    expect(call.maxTokens).toBe(16000);
    expect(call.system[0]?.text).toMatch(/personalisation engine/);
    expect(call.system[1]?.cache_control).toEqual({ type: "ephemeral" });
    expect(call.system[1]?.text).toMatch(/Lesson catalogue/);
    const user = JSON.parse(call.user) as { profile: unknown; metrics: unknown; today: string };
    expect(user.today).toBe("2026-09-01");
    expect(user.profile).toEqual(fixtures.sarah);
    expect(user.metrics).toEqual(res.metrics);
  });

  it("retries once with the validation problems, then succeeds", async () => {
    const bad = modelOutput();
    bad.regions[0]!.lessonIds = ["nope"];
    const { client, calls } = fakeClient({ structured: [{ output: bad }, { output: modelOutput() }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue });

    expect(res.source).toBe("ai");
    expect(res.attempts).toBe(2);
    const retry = JSON.parse(calls.structured[1]!.user) as { previousAttemptProblems: string[]; instruction: string };
    expect(retry.previousAttemptProblems.join(" ")).toMatch(/unknown lessonId nope/);
    expect(retry.instruction).toMatch(/failed validation/);
  });

  it("falls back to the template plan after every attempt fails validation", async () => {
    const bad = modelOutput();
    bad.nextStepId = "ghost";
    const { client } = fakeClient({ structured: [{ output: bad }, { output: bad }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue });

    expect(res.source).toBe("template");
    expect(res.plan.source).toBe("template");
    expect(res.attempts).toBe(2);
    expect(res.problems?.join(" ")).toMatch(/nextStepId ghost/);
    expect(res.usage.inputTokens).toBe(200);
  });

  it("does not retry a refusal", async () => {
    const { client, calls } = fakeClient({ structured: [{ refusal: true }, { output: modelOutput() }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue });

    expect(res.source).toBe("template");
    expect(res.attempts).toBe(1);
    expect(res.stopReason).toBe("refusal");
    expect(calls.structured).toHaveLength(1);
  });

  it("retries when the output could not be parsed", async () => {
    const { client } = fakeClient({ structured: [{ output: null }, { output: modelOutput() }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue });
    expect(res.source).toBe("ai");
    expect(res.attempts).toBe(2);
  });

  it("respects maxAttempts", async () => {
    const bad = modelOutput();
    bad.nextStepId = "ghost";
    const { client, calls } = fakeClient({ structured: [{ output: bad }, { output: bad }, { output: bad }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue, maxAttempts: 3 });
    expect(res.attempts).toBe(3);
    expect(calls.structured).toHaveLength(3);
  });

  it("uses the real catalogue by default and the template plan passes against it", async () => {
    const { client, calls } = fakeClient({ structured: [{ output: modelOutput() }] });
    const res = await generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW });
    expect(res.source).toBe("ai");
    expect(calls.structured[0]!.system[1]?.text).toMatch(/budgeting-basics/);
  });

  it("propagates client errors", async () => {
    const { client } = fakeClient({ structured: [{ error: new Error("network down") }] });
    await expect(generatePlan(fixtures.sarah, { client, now: FIXTURE_NOW, catalogue })).rejects.toThrow(/network down/);
  });
});
