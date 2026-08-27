import { describe, expect, it } from "vitest";
import { applyProgress, computeMetrics, FIXTURE_NOW, fixtures, templatePlan } from "@free-me/core";
import { allocate, allocationProblems, eligibleBuckets, FLEXIBLE_KEY, ruleAllocation } from "./allocate";
import { fakeClient } from "./testing/fake-client";

const sarah = () => {
  const metrics = computeMetrics(fixtures.sarah, { now: FIXTURE_NOW });
  let plan = templatePlan(fixtures.sarah, metrics, { now: FIXTURE_NOW });
  for (const id of ["foundation.understand-spending", "foundation.build-budget"]) {
    plan = applyProgress(plan, { type: "step_status", stepId: id, status: "done" }).plan;
  }
  return { plan, metrics, profile: fixtures.sarah };
};

describe("eligibleBuckets", () => {
  it("lists open saving regions, goal regions even when locked, and flexible", () => {
    const { plan, metrics } = sarah();
    const keys = eligibleBuckets(plan, metrics).map((b) => b.key);
    expect(keys[0]).toBe("security");
    expect(keys).toContain("goal-g-japan");
    expect(keys[keys.length - 1]).toBe(FLEXIBLE_KEY);
    expect(keys).not.toContain("markets");
    expect(keys).not.toContain("foundation");
  });

  it("marks goals behind schedule and reports what each bucket needs", () => {
    const { plan, metrics } = sarah();
    const japan = eligibleBuckets(plan, metrics).find((b) => b.key === "goal-g-japan");
    expect(japan?.note).toBe("behind schedule");
    expect(japan?.remaining).toBe(6000);
    const security = eligibleBuckets(plan, metrics).find((b) => b.key === "security");
    expect(security?.remaining).toBe(2200);
  });

  it("excludes locked non-goal regions before foundation is done", () => {
    const metrics = computeMetrics(fixtures.sarah, { now: FIXTURE_NOW });
    const plan = templatePlan(fixtures.sarah, metrics, { now: FIXTURE_NOW });
    const keys = eligibleBuckets(plan, metrics).map((b) => b.key);
    expect(keys).not.toContain("security");
    expect(keys).toContain("goal-g-japan");
  });
});

describe("ruleAllocation", () => {
  it("buffer first, then goals, remainder flexible — and always sums to the amount", () => {
    const input = { ...sarah(), amount: 1000 };
    const a = ruleAllocation(input);
    expect(a.amount).toBe(1000);
    expect(a.buckets.reduce((s, b) => s + b.amount, 0)).toBe(1000);
    expect(a.buckets.find((b) => b.key === "security")?.amount).toBe(400);
    expect(a.buckets.find((b) => b.key === "goal-g-japan")?.amount).toBe(400);
    expect(a.buckets.find((b) => b.key === FLEXIBLE_KEY)?.amount).toBe(200);
  });

  it("puts everything in flexible when nothing is eligible", () => {
    const metrics = computeMetrics(fixtures.userB, { now: FIXTURE_NOW });
    const plan = templatePlan(fixtures.userB, metrics, { now: FIXTURE_NOW });
    const a = ruleAllocation({ plan, metrics, profile: fixtures.userB, amount: 500 });
    expect(a.buckets.reduce((s, b) => s + b.amount, 0)).toBe(500);
  });
});

describe("allocationProblems", () => {
  it("checks the sum, integers, eligibility and language", () => {
    const { plan, metrics } = sarah();
    const eligible = eligibleBuckets(plan, metrics);
    const problems = allocationProblems(
      {
        buckets: [
          { key: "security", label: "x", amount: 300.5, reason: "ok" },
          { key: "markets", label: "x", amount: 100, reason: "Buy Vanguard" },
        ],
        summary: "You should buy shares",
      },
      1000,
      eligible,
    );
    expect(problems.join("\n")).toMatch(/sum to 400.5, expected 1000/);
    expect(problems.join("\n")).toMatch(/security: amount must be a non-negative integer/);
    expect(problems.join("\n")).toMatch(/markets: not an eligible bucket/);
    expect(problems.join("\n")).toMatch(/markets: reason contains advice/);
    expect(problems.join("\n")).toMatch(/summary contains advice/);
  });
});

describe("allocate", () => {
  const good = {
    buckets: [
      { key: "security", label: "Financial security", amount: 600, reason: "Your buffer is $2,200 short." },
      { key: "goal-g-japan", label: "Trip to Japan", amount: 300, reason: "Japan is behind schedule." },
      { key: FLEXIBLE_KEY, label: "Flexible savings", amount: 100, reason: "Keeps options open." },
    ],
    summary: "Buffer first, then Japan.",
  };

  it("accepts a valid allocation from the model", async () => {
    const { client, calls } = fakeClient({ structured: [{ output: good }] });
    const res = await allocate({ ...sarah(), amount: 1000 }, { client });
    expect(res.source).toBe("ai");
    expect(res.attempts).toBe(1);
    expect(res.allocation.amount).toBe(1000);
    expect(res.allocation.buckets).toHaveLength(3);
    expect(calls.structured[0]!.effort).toBe("medium");
    const user = JSON.parse(calls.structured[0]!.user) as { amount: number; eligibleBuckets: { key: string }[] };
    expect(user.amount).toBe(1000);
    expect(user.eligibleBuckets.map((b) => b.key)).toContain("security");
  });

  it("retries on a sum mismatch and then accepts", async () => {
    const off = { ...good, buckets: good.buckets.map((b, i) => (i === 0 ? { ...b, amount: 500 } : b)) };
    const { client, calls } = fakeClient({ structured: [{ output: off }, { output: good }] });
    const res = await allocate({ ...sarah(), amount: 1000 }, { client });
    expect(res.source).toBe("ai");
    expect(res.attempts).toBe(2);
    expect(calls.structured[1]!.user).toMatch(/sum to 900, expected 1000/);
  });

  it("falls back to the rules when the model keeps getting it wrong", async () => {
    const off = { ...good, buckets: [{ key: "markets", label: "x", amount: 1000, reason: "r" }] };
    const { client } = fakeClient({ structured: [{ output: off }, { output: off }] });
    const res = await allocate({ ...sarah(), amount: 1000 }, { client });
    expect(res.source).toBe("rules");
    expect(res.allocation.buckets.reduce((s, b) => s + b.amount, 0)).toBe(1000);
  });

  it("falls back immediately on a refusal", async () => {
    const { client, calls } = fakeClient({ structured: [{ refusal: true }, { output: good }] });
    const res = await allocate({ ...sarah(), amount: 1000 }, { client });
    expect(res.source).toBe("rules");
    expect(calls.structured).toHaveLength(1);
  });
});
