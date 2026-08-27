import type { Allocation, FreedomPlan, FreedomProfile, Metrics, PlanMode, ProgressEvent } from "@free-me/core";

/**
 * Persistence behind the API. In-memory for the hackathon; Phase 4 swaps in a
 * Supabase implementation of the same interface without touching the routes.
 */

export interface StoredSession {
  id: string;
  profile: FreedomProfile | null;
  plan: FreedomPlan | null;
  metrics: Metrics | null;
  planMode: PlanMode | null;
  events: ProgressEvent[];
  allocations: Allocation[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanRepository {
  get(id: string): Promise<StoredSession | null>;
  upsert(session: StoredSession): Promise<StoredSession>;
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
    createdAt: now,
    updatedAt: now,
  };
}

export class MemoryRepository implements PlanRepository {
  private readonly sessions = new Map<string, StoredSession>();

  async get(id: string): Promise<StoredSession | null> {
    const s = this.sessions.get(id);
    return s ? structuredClone(s) : null;
  }

  async upsert(session: StoredSession): Promise<StoredSession> {
    const copy = structuredClone({ ...session, updatedAt: new Date().toISOString() });
    this.sessions.set(session.id, copy);
    return structuredClone(copy);
  }

  get size(): number {
    return this.sessions.size;
  }
}

declare global {
  var __freeMeRepository: PlanRepository | undefined;
}

/** One repository per server process; survives dev-server hot reloads. */
export function getRepository(): PlanRepository {
  if (!globalThis.__freeMeRepository) globalThis.__freeMeRepository = new MemoryRepository();
  return globalThis.__freeMeRepository;
}

/** Tests only. */
export function setRepository(repo: PlanRepository | undefined): void {
  globalThis.__freeMeRepository = repo;
}
