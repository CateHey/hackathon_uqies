import { describe, expect, it } from "vitest";
import { computeMetrics, FIXTURE_NOW, fixtures, templatePlan } from "@free-me/core";
import { explain, findPlanItem, NotFoundError } from "./explain";
import { fakeClient } from "./testing/fake-client";

const ctx = () => {
  const metrics = computeMetrics(fixtures.sarah, { now: FIXTURE_NOW });
  const plan = templatePlan(fixtures.sarah, metrics, { now: FIXTURE_NOW });
  return { plan, metrics, profile: fixtures.sarah };
};

describe("explain", () => {
  it("returns the model's explanation with a low-effort, cached call", async () => {
    const { client, calls } = fakeClient({
      structured: [{ output: { explanation: "Because your $800 covers only half a month of expenses." } }],
    });
    const res = await explain({ ...ctx(), itemType: "region", itemId: "security" }, { client });
    expect(res.source).toBe("ai");
    expect(res.explanation).toMatch(/\$800/);
    expect(calls.structured[0]!.effort).toBe("low");
    expect(calls.structured[0]!.system[0]?.cache_control).toEqual({ type: "ephemeral" });
    const user = JSON.parse(calls.structured[0]!.user) as { item: { id: string }; metrics: { emergencyGap: number } };
    expect(user.item.id).toBe("security");
    expect(user.metrics.emergencyGap).toBe(2200);
  });

  it("falls back to the item's own why when the model returns nothing", async () => {
    const { client } = fakeClient({ structured: [{ output: null }] });
    const c = ctx();
    const res = await explain({ ...c, itemType: "step", itemId: "security.emergency-buffer" }, { client });
    expect(res.source).toBe("plan");
    expect(res.explanation).toBe(c.plan.steps.find((s) => s.id === "security.emergency-buffer")!.why);
  });

  it("falls back when the explanation reads like advice", async () => {
    const { client } = fakeClient({ structured: [{ output: { explanation: "You should buy an ETF from Vanguard." } }] });
    const c = ctx();
    const res = await explain({ ...c, itemType: "bridge", itemId: "growth->markets" }, { client });
    expect(res.source).toBe("plan");
    expect(res.explanation).toBe(c.plan.bridges.find((b) => b.id === "growth->markets")!.why);
  });

  it("throws NotFoundError for unknown items", async () => {
    const { client } = fakeClient({ structured: [] });
    await expect(explain({ ...ctx(), itemType: "region", itemId: "atlantis" }, { client })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("findPlanItem covers all item types", () => {
    const { plan } = ctx();
    expect(findPlanItem(plan, "region", "growth")?.id).toBe("growth");
    expect(findPlanItem(plan, "bridge", "security->growth")?.id).toBe("security->growth");
    expect(findPlanItem(plan, "step", "growth.saving-target")?.id).toBe("growth.saving-target");
    expect(findPlanItem(plan, "step", "nope")).toBeUndefined();
  });
});
