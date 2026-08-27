/**
 * Integration test: calls the route handlers directly (no HTTP server) through the
 * full profile → generate → plan → progress → why → allocate → lesson flow.
 * Runs in template mode (no ANTHROPIC_API_KEY), so nothing touches the network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtures, GenerateResponse, LessonPayload, PlanBundle, ProgressResponse } from "@free-me/core";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}));

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
});

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
    const res = await demo(req(null), params({ name: "sarah" }));
    const data = GenerateResponse.parse(await res.json());
    expect(data.mode).toBe("demo");
    expect(data.plan.regions.find((r) => r.id === "foundation")?.status).toBe("complete");
    expect(data.plan.currentPriorityRegionId).toBe("security");
    expect((await demo(req(null), params({ name: "nobody" }))).status).toBe(404);
  });

  it("DEMO_MODE=true generates instantly in demo mode", async () => {
    process.env.DEMO_MODE = "true";
    await postProfile(req(fixtures.userB), {});
    const generated = GenerateResponse.parse(await (await generate(req(null), {})).json());
    expect(generated.mode).toBe("demo");
    expect(generated.plan.currentPriorityRegionId).toBe("growth");
  });
});
