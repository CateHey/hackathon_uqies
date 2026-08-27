"use client";

import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import {
  AllocateApiResponse,
  GenerateResponse,
  HealthResponse,
  LessonPayload,
  PlanBundle,
  ProfileResponse,
  ProgressResponse,
  WhyApiResponse,
  type AllocationRequest,
  type DemoName,
  type FreedomProfile,
  type ProgressEvent,
  type WhyRequest,
} from "@free-me/core";

/**
 * Typed access to the Free Me API, shared by the web app and (later) the mobile app.
 * Every response is validated with the shared Zod schemas before it reaches a component.
 */

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiOptions {
  /** e.g. "https://free-me.app" for mobile; "" for same-origin web. */
  baseUrl?: string;
  fetch?: typeof fetch;
}

export function createApi(opts: ApiOptions = {}) {
  const base = opts.baseUrl ?? "";
  const doFetch = opts.fetch ?? ((input, init) => fetch(input, init));

  async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
    const res = await doFetch(`${base}/api${path}`, {
      credentials: "include",
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (body ?? {}) as { code?: string; message?: string };
      throw new ApiClientError(res.status, err.code ?? "unknown", err.message ?? res.statusText);
    }
    return schema.parse(body);
  }

  const post = (body?: unknown): RequestInit => ({ method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

  return {
    health: () => request("/health", HealthResponse),
    saveProfile: (profile: FreedomProfile) => request("/profile", ProfileResponse, post(profile)),
    getProfile: () => request("/profile", ProfileResponse),
    generatePlan: (opts?: { force?: "template" }) => request("/plan/generate", GenerateResponse, post(opts ?? {})),
    getPlan: () => request("/plan", PlanBundle),
    why: (req: WhyRequest) => request("/plan/why", WhyApiResponse, post(req)),
    allocate: (req: AllocationRequest) => request("/allocate", AllocateApiResponse, post(req)),
    progress: (event: ProgressEvent) => request("/progress", ProgressResponse, post(event)),
    lesson: (id: string) => request(`/lessons/${encodeURIComponent(id)}`, LessonPayload),
    loadDemo: (name: DemoName) => request(`/demo/${name}`, GenerateResponse, post()),

    /** Streams the personalised lesson as text chunks. */
    async *personaliseLesson(id: string, signal?: AbortSignal): AsyncIterable<string> {
      const res = await doFetch(`${base}/api/lessons/${encodeURIComponent(id)}/personalise`, {
        method: "POST",
        credentials: "include",
        signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
        throw new ApiClientError(res.status, err.code ?? "unknown", err.message ?? res.statusText);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    },
  };
}

export type Api = ReturnType<typeof createApi>;

// ---------------------------------------------------------------- React bindings

const ApiContext = createContext<Api | null>(null);
export const ApiProvider = ApiContext.Provider;

export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error("Wrap the app in <ApiProvider value={createApi()}>");
  return api;
}

export const planKey = ["plan"] as const;
export const lessonKey = (id: string) => ["lesson", id] as const;

export function usePlan(opts: { enabled?: boolean } = {}) {
  const api = useApi();
  return useQuery({
    queryKey: planKey,
    queryFn: () => api.getPlan(),
    enabled: opts.enabled ?? true,
    retry: (count, err) => !(err instanceof ApiClientError && err.status === 404) && count < 2,
    staleTime: 60_000,
  });
}

export function useSaveProfile() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: FreedomProfile) => api.saveProfile(profile),
    onSuccess: () => qc.removeQueries({ queryKey: planKey }),
  });
}

export function useGeneratePlan() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts?: { force?: "template" }) => api.generatePlan(opts),
    onSuccess: (data) => qc.setQueryData(planKey, { profile: data.profile, plan: data.plan, metrics: data.metrics }),
  });
}

export function useLoadDemo() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: DemoName) => api.loadDemo(name),
    onSuccess: (data) => qc.setQueryData(planKey, { profile: data.profile, plan: data.plan, metrics: data.metrics }),
  });
}

export function useWhy() {
  const api = useApi();
  return useMutation({ mutationFn: (req: WhyRequest) => api.why(req) });
}

export function useAllocate() {
  const api = useApi();
  return useMutation({ mutationFn: (req: AllocationRequest) => api.allocate(req) });
}

export function useProgress() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: ProgressEvent) => api.progress(event),
    onSuccess: (data) => {
      qc.setQueryData(planKey, (prev: PlanBundle | undefined) =>
        prev ? { ...prev, plan: data.plan, metrics: data.metrics } : prev,
      );
    },
  });
}

export function useLesson(id: string) {
  const api = useApi();
  return useQuery({ queryKey: lessonKey(id), queryFn: () => api.lesson(id), staleTime: Infinity });
}
