/**
 * Integration test: calls the route handlers directly (no HTTP server) through the
 * full profile → generate → plan → progress → why → allocate → lesson flow.
 * Runs in template mode (no ANTHROPIC_API_KEY), so nothing touches the network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeMetrics,
  FIXTURE_NOW,
  fixtures,
  GenerateResponse,
  LessonPayload,
  PlanBundle,
  PlanStatusResponse,
  ProgressResponse,
  templatePlan,
} from "@free-me/core";
import type { AiClient } from "@free-me/ai";
import { fakeClient } from "@free-me/ai/testing";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}));

// `after()` needs a request scope in Next; in tests, just run the work immediately.
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return { ...mod, after: (fn: () => unknown) => void fn() };
});

// Swap the real Anthropic client for a scripted one in AI-mode tests.
const ai = vi.hoisted(() => ({ client: null as AiClient | null }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/ai")>();
  return { ...mod, getAiClient: () => ai.client ?? mod.getAiClient() };
});

import { MemoryRepository, setRepository } from "./repository";
import { POST as postProfile } from "@/app/api/profile/route";
import { POST as generate } from "@/app/api/plan/generate/route";
import { GET as getPlan } from "@/app/api/plan/route";
import { POST as why } from "@/app/api/plan/why/route";
import { POST as progress } from "@/app/api/progress/route";
import { POST as allocate } from "@/app/api/allocate/route";
import { GET as getLesson } from "@/app/api/lessons/[id]/route";
import { POST as personalise } from "@/app/api/lessons/[id]/personalise/route";
import { POST as demo } from "@/app/api/demo/[name]/route";
import { GET as health } from "@/app/api/health/route";
import { GET as planStatus } from "@/app/api/plan/status/route";
import { POST as applyUpgrade } from "@/app/api/plan/upgrade/route";

const req = (body?: unknown) =>
  new Request("http://localhost/api/x", {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

beforeEach(() => {
  jar.clear();
  setRepository(new MemoryRepository());
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.DEMO_MODE;
  ai.client = null;
});

const waitFor = async (check: () => Promise<boolean>, ms = 3000) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
};

describe("API flow (template mode)", () => {
  it("health reports the mode", async () => {
    const res = await health(req(), {});
    expect(await res.json()).toMatchObject({ ok: true, mode: "template" });
  });

  it("rejects an invalid profile with a typed error", async () => {
    const res = await postProfile(req({ ...fixtures.sarah, goals: [] }), {});
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "validation_error" });
  });

  it("404s on the plan before onboarding", async () => {
    const res = await getPlan(req(), {});
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "no_profile" });
  });

  it("profile → generate → plan → progress → why → allocate → lesson", async () => {
    expect((await postProfile(req(fixtures.sarah), {})).status).toBe(200);
    expect(jar.has("fm_session")).toBe(true);

    const gen = await generate(req(null), {});
    expect(gen.status).toBe(200);
    const generated = GenerateResponse.parse(await gen.json());
    expect(generated.mode).toBe("template");
    expect(generated.source).toBe("template");
    expect(generated.plan.currentPriorityRegionId).toBe("foundation");

    const bundle = PlanBundle.parse(await (await getPlan(req(), {})).json());
    expect(bundle.plan.nextStepId).toBe("foundation.understand-spending");
    expect(bundle.metrics.emergencyTarget).toBe(3000);

    const prog = await progress(req({ type: "step_status", stepId: "foundation.understand-spending", status: "done" }), {});
    const progressed = ProgressResponse.parse(await prog.json());
    expect(progressed.unlockedBridgeIds).toEqual(["foundation->security"]);
    expect(progressed.plan.nextStepId).toBe("foundation.build-budget");

    const again = PlanBundle.parse(await (await getPlan(req(), {})).json());
    expect(again.plan.regions.find((r) => r.id === "security")?.status).toBe("available");

    const w = await why(req({ itemType: "region", itemId: "security" }), {});
    expect(await w.json()).toMatchObject({ source: "plan" });
    expect((await why(req({ itemType: "region", itemId: "atlantis" }), {})).status).toBe(404);

    const al = await allocate(req({ amount: 1000 }), {});
    const allocation = (await al.json()) as { allocation: { amount: number; buckets: { amount: number }[] }; source: string };
    expect(allocation.source).toBe("rules");
    expect(allocation.allocation.buckets.reduce((s, b) => s + b.amount, 0)).toBe(1000);

    const lesson = LessonPayload.parse(await (await getLesson(req(), params({ id: "budgeting-basics" }))).json());
    expect(lesson.title).toBe("Budgeting basics");
    expect((await getLesson(req(), params({ id: "nope" }))).status).toBe(404);

    const stream = await personalise(req(null), params({ id: "budgeting-basics" }));
    expect(stream.headers.get("content-type")).toMatch(/text\/plain/);
    const text = await stream.text();
    expect(text).toMatch(/Reading as:/);
    expect(text).toMatch(/## /);
  });

  it("unknown progress steps 404", async () => {
    await postProfile(req(fixtures.sarah), {});
    await generate(req(null), {});
    const res = await progress(req({ type: "step_status", stepId: "ghost", status: "done" }), {});
    expect(res.status).toBe(404);
  });

  it("loads a demo persona into the session", async () => {
    const res = await demo(req(null), params({ name: "vinuy" }));
    const data = GenerateResponse.parse(await res.json());
    expect(data.mode).toBe("demo");
    expect(data.profile.goals[0]?.label).toBe("10% house deposit");
    // Vinuy arrives with the foundations already done (see DEMO_COMPLETED_REGIONS).
    expect(data.plan.regions.find((r) => r.id === "foundation")?.status).toBe("complete");
    expect((await demo(req(null), params({ name: "nobody" }))).status).toBe(404);
  });

  it("AI mode: instant template map, personalised plan upgraded in the background", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const full = templatePlan(fixtures.sarah, computeMetrics(fixtures.sarah, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    // The model produces a plan without provenance fields.
    const { version, source, generatedAt, ...output } = full;
    void version;
    void source;
    void generatedAt;
    ai.client = fakeClient({ structured: [{ output }] }).client;

    await postProfile(req(fixtures.sarah), {});
    const generated = GenerateResponse.parse(await (await generate(req(null), {})).json());
    expect(generated.mode).toBe("ai");
    expect(generated.source).toBe("template");
    expect(generated.pending).toBe(true);

    const ready = await waitFor(async () => {
      const s = PlanStatusResponse.parse(await (await planStatus(req(), {})).json());
      return s.upgradeReady && !s.pending;
    });
    expect(ready).toBe(true);

    const status = PlanStatusResponse.parse(await (await planStatus(req(), {})).json());
    expect(status).toMatchObject({ pending: false, upgradeReady: true, eventsSince: 0, error: null });

    const upgraded = PlanBundle.parse(await (await applyUpgrade(req(null), {})).json());
    expect(upgraded.plan.source).toBe("ai");
    expect(PlanBundle.parse(await (await getPlan(req(), {})).json()).plan.source).toBe("ai");
    const after = PlanStatusResponse.parse(await (await planStatus(req(), {})).json());
    expect(after.upgradeReady).toBe(false);
    expect((await applyUpgrade(req(null), {})).status).toBe(409);
  });

  it("AI mode: a refusal leaves the starter plan and reports the error", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    ai.client = fakeClient({ structured: [{ refusal: true }] }).client;
    await postProfile(req(fixtures.sarah), {});
    await generate(req(null), {});
    const settled = await waitFor(async () => !PlanStatusResponse.parse(await (await planStatus(req(), {})).json()).pending);
    expect(settled).toBe(true);
    const status = PlanStatusResponse.parse(await (await planStatus(req(), {})).json());
    expect(status.upgradeReady).toBe(false);
    expect(status.error).toMatch(/refused/);
    expect(PlanBundle.parse(await (await getPlan(req(), {})).json()).plan.source).toBe("template");
  });

  it("DEMO_MODE=true generates instantly in demo mode", async () => {
    process.env.DEMO_MODE = "true";
    await postProfile(req(fixtures.userB), {});
    const generated = GenerateResponse.parse(await (await generate(req(null), {})).json());
    expect(generated.mode).toBe("demo");
    expect(generated.plan.currentPriorityRegionId).toBe("growth");
  });
});
