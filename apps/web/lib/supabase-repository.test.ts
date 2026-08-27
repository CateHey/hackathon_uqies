/**
 * Round-trip against the real (hosted) Supabase project. Skipped when the project isn't
 * configured. Loads apps/web/.env.local into this worker's process.env itself — nothing is
 * printed. Run with `pnpm db:test`.
 */
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { computeMetrics, FIXTURE_NOW, fixtures, templatePlan } from "@free-me/core";
import { emptySession } from "./repository";
import { SupabaseRepository, sessionIdForUser, userIdOf } from "./repository-supabase";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // no .env.local — the suite below is skipped
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("session id helpers", () => {
  it("maps users to 'user:<id>' and back; guests have no user id", () => {
    expect(sessionIdForUser("abc")).toBe("user:abc");
    expect(userIdOf("user:abc")).toBe("abc");
    expect(userIdOf("9f1c-guest")).toBeNull();
  });
});

describe.skipIf(!url || !key)("SupabaseRepository against the hosted project", () => {
  const repo = new SupabaseRepository(createClient(url ?? "", key ?? "", { auth: { persistSession: false } }));
  const id = `test:${crypto.randomUUID()}`;

  it("schema is applied and reachable", async () => {
    const probe = await repo.ready();
    expect(probe.error, "run supabase/migrations/0001_init.sql in the SQL editor").toBeNull();
    expect(probe.ok).toBe(true);
  });

  it("round-trips a session, records a plan, deletes cleanly", async () => {
    const profile = fixtures.sarah;
    const metrics = computeMetrics(profile, { now: FIXTURE_NOW });
    const plan = templatePlan(profile, metrics, { now: FIXTURE_NOW });

    expect(await repo.get(id)).toBeNull();
    const session = { ...emptySession(id), profile, plan, metrics, planMode: "template" as const };
    await repo.upsert(session);

    const back = await repo.get(id);
    expect(back?.profile?.freedomStatement).toBe(profile.freedomStatement);
    expect(back?.plan?.currentPriorityRegionId).toBe(plan.currentPriorityRegionId);
    expect(back?.events).toEqual([]);

    await repo.recordPlan({ sessionId: id, plan, metrics, mode: "template" });

    await repo.delete(id);
    expect(await repo.get(id)).toBeNull();
  });
});
