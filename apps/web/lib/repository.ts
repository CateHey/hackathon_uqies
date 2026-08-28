import type {
  Allocation,
  FreedomPlan,
  FreedomProfile,
  Metrics,
  PlanMode,
  PlanSource,
  ProgressEvent,
} from "@free-me/core";
import { SupabaseRepository } from "./repository-supabase";
import { supabaseAdmin } from "./supabase/server";

/**
 * Persistence behind the API. `MemoryRepository` for tests and key-less local runs;
 * `SupabaseRepository` (repository-supabase.ts) when Supabase is configured. The routes
 * only ever see this interface.
 */

/** A personalised plan built in the background, waiting to replace the current one. */
export interface PlanUpgrade {
  plan: FreedomPlan;
  metrics: Metrics;
  source: PlanSource;
  attempts: number;
  startedAt: string;
  finishedAt: string;
}

export interface StoredSession {
  id: string;
  profile: FreedomProfile | null;
  plan: FreedomPlan | null;
  metrics: Metrics | null;
  planMode: PlanMode | null;
  events: ProgressEvent[];
  allocations: Allocation[];
  /** Set while the model is building a personalised plan for this session. */
  pendingUpgrade: { startedAt: string } | null;
  upgrade: PlanUpgrade | null;
  upgradeError: string | null;
  /** The profile was edited after this plan was built, so the map no longer matches the numbers. */
  planStale: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One entry in the append-only plan history (cost tracking, audit). */
export interface PlanRecord {
  sessionId: string;
  plan: FreedomPlan;
  metrics: Metrics;
  mode: PlanMode;
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number } | null;
  createdAt?: string;
}

export interface PlanRepository {
  get(id: string): Promise<StoredSession | null>;
  upsert(session: StoredSession): Promise<StoredSession>;
  delete(id: string): Promise<void>;
  recordPlan(record: PlanRecord): Promise<void>;
  /** How many model-generated plans this session has had since `since` — the basis for rate limiting. */
  countAiPlansSince(sessionId: string, since: Date): Promise<number>;
}

export function emptySession(id: string): StoredSession {
  const now = new Date().toISOString();
  return {
    id,
    profile: null,
    plan: null,
    metrics: null,
    planMode: null,
    events: [],
    allocations: [],
    pendingUpgrade: null,
    upgrade: null,
    upgradeError: null,
    planStale: false,
    createdAt: now,
    updatedAt: now,
  };
}

export class MemoryRepository implements PlanRepository {
  private readonly sessions = new Map<string, StoredSession>();
  readonly history: PlanRecord[] = [];

  async get(id: string): Promise<StoredSession | null> {
    const s = this.sessions.get(id);
    return s ? structuredClone(s) : null;
  }

  async upsert(session: StoredSession): Promise<StoredSession> {
    const copy = structuredClone({ ...session, updatedAt: new Date().toISOString() });
    this.sessions.set(session.id, copy);
    return structuredClone(copy);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async recordPlan(record: PlanRecord): Promise<void> {
    this.history.push(structuredClone({ ...record, createdAt: new Date().toISOString() }));
  }

  async countAiPlansSince(sessionId: string, since: Date): Promise<number> {
    return this.history.filter(
      (r) => r.sessionId === sessionId && r.mode === "ai" && new Date(r.createdAt ?? 0) >= since,
    ).length;
  }

  get size(): number {
    return this.sessions.size;
  }
}

export interface RepositoryStatus {
  kind: "memory" | "supabase";
  /** Set when Supabase is configured but couldn't be used (schema not applied, unreachable). */
  error: string | null;
}

/**
 * Supabase when it is configured AND its schema answers; otherwise in-memory, loudly.
 * The probe runs once on first use and is retried by /api/health until it succeeds,
 * so applying the migration flips the app over without a restart.
 */
export class ResilientRepository implements PlanRepository {
  private chosen: Promise<{ repo: PlanRepository; status: RepositoryStatus }> | null = null;
  private readonly memory = new MemoryRepository();

  constructor(private readonly configured: boolean) {}

  private choose() {
    if (!this.chosen) {
      this.chosen = (async () => {
        if (!this.configured) return { repo: this.memory, status: { kind: "memory" as const, error: null } };
        const supabase = new SupabaseRepository(supabaseAdmin());
        const probe = await supabase.ready();
        if (probe.ok) return { repo: supabase, status: { kind: "supabase" as const, error: null } };
        console.error(
          `[db] Supabase is configured but not ready (${probe.error}). Using in-memory storage until the schema is applied — see supabase/README.md.`,
        );
        return { repo: this.memory, status: { kind: "memory" as const, error: probe.error } };
      })();
    }
    return this.chosen;
  }

  /** Current choice; re-probes when the last attempt fell back so a fresh migration is picked up. */
  async status(): Promise<RepositoryStatus> {
    const current = await this.choose();
    if (current.status.kind === "memory" && this.configured) {
      this.chosen = null;
      return (await this.choose()).status;
    }
    return current.status;
  }

  async get(id: string) {
    return (await this.choose()).repo.get(id);
  }
  async upsert(session: StoredSession) {
    return (await this.choose()).repo.upsert(session);
  }
  async delete(id: string) {
    return (await this.choose()).repo.delete(id);
  }
  async recordPlan(record: PlanRecord) {
    return (await this.choose()).repo.recordPlan(record);
  }
  async countAiPlansSince(sessionId: string, since: Date) {
    return (await this.choose()).repo.countAiPlansSince(sessionId, since);
  }
}

declare global {
  var __freeMeRepository: PlanRepository | undefined;
}

/** One repository per server process; survives dev-server hot reloads (and replaces stale pre-wrapper instances). */
export function getRepository(): PlanRepository {
  const existing = globalThis.__freeMeRepository;
  if (!existing || (!(existing instanceof MemoryRepository) && typeof (existing as ResilientRepository).status !== "function")) {
    globalThis.__freeMeRepository = new ResilientRepository(supabaseConfigured());
  }
  return globalThis.__freeMeRepository as PlanRepository;
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** What the running process is actually using, with the reason if it isn't Supabase. */
export async function repositoryStatus(): Promise<RepositoryStatus> {
  const repo = getRepository() as Partial<ResilientRepository>;
  if (typeof repo.status === "function") return repo.status();
  return { kind: "memory", error: null };
}

/** Tests only. */
export function setRepository(repo: PlanRepository | undefined): void {
  globalThis.__freeMeRepository = repo;
}
