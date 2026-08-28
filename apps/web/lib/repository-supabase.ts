import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanRecord, PlanRepository, StoredSession } from "./repository";
import { emptySession } from "./repository";

/**
 * Postgres-backed repository (Supabase). One `sessions` row per guest/user holding the
 * StoredSession document; `plans` keeps an append-only history with token usage.
 * Uses the service-role client — server only.
 */
export class SupabaseRepository implements PlanRepository {
  constructor(private readonly db: SupabaseClient) {}

  async get(id: string): Promise<StoredSession | null> {
    const { data, error } = await this.db.from("sessions").select("data").eq("id", id).maybeSingle();
    if (error) throw new Error(`sessions.get failed: ${error.message}`);
    if (!data) return null;
    // Tolerate documents written before newer fields existed.
    return { ...emptySession(id), ...(data.data as Partial<StoredSession>), id };
  }

  async upsert(session: StoredSession): Promise<StoredSession> {
    const updated = { ...session, updatedAt: new Date().toISOString() };
    const { error } = await this.db
      .from("sessions")
      .upsert({ id: session.id, user_id: userIdOf(session.id), data: updated, updated_at: updated.updatedAt }, { onConflict: "id" });
    if (error) throw new Error(`sessions.upsert failed: ${error.message}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("sessions").delete().eq("id", id);
    if (error) throw new Error(`sessions.delete failed: ${error.message}`);
  }

  async recordPlan(record: PlanRecord): Promise<void> {
    const { error } = await this.db.from("plans").insert({
      session_id: record.sessionId,
      user_id: userIdOf(record.sessionId),
      version: record.plan.version,
      source: record.plan.source,
      mode: record.mode,
      plan: record.plan,
      metrics: record.metrics,
      usage: record.usage ?? null,
    });
    if (error) throw new Error(`plans.insert failed: ${error.message}`);
  }

  async countAiPlansSince(sessionId: string, since: Date): Promise<number> {
    const { count, error } = await this.db
      .from("plans")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("mode", "ai")
      .gte("created_at", since.toISOString());
    if (error) throw new Error(`plans.count failed: ${error.message}`);
    return count ?? 0;
  }

  /** Cheap probe used by /api/health: is the schema applied and reachable? (A real select — HEAD requests don't surface a missing table.) */
  async ready(): Promise<{ ok: boolean; error: string | null }> {
    const sessions = await this.db.from("sessions").select("id").limit(1);
    if (sessions.error) return { ok: false, error: `sessions: ${sessions.error.message}` };
    const plans = await this.db.from("plans").select("id").limit(1);
    if (plans.error) return { ok: false, error: `plans: ${plans.error.message}` };
    return { ok: true, error: null };
  }
}

/** Session ids for signed-in people are "user:<uuid>"; guests are opaque cookie ids. */
export function userIdOf(sessionId: string): string | null {
  return sessionId.startsWith("user:") ? sessionId.slice(5) : null;
}

export function sessionIdForUser(userId: string): string {
  return `user:${userId}`;
}
