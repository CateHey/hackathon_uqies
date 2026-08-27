import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  applyProgress,
  computeMetrics,
  fixtures,
  PlanBundle,
  templatePlan,
  type DemoName,
  type PlanBundle as PlanBundleT,
  type ProgressEvent,
} from "@free-me/core";

/** A little history so the demo profiles don't all start at square one. */
const DEMO_EVENTS: Partial<Record<DemoName, ProgressEvent[]>> = {
  sarah: [
    { type: "step_status", stepId: "foundation.understand-spending", status: "done" },
    { type: "step_status", stepId: "foundation.build-budget", status: "done" },
  ],
  userA: [{ type: "step_status", stepId: "foundation.understand-spending", status: "done" }],
};

/** Prefer a real AI golden plan when one has been generated; otherwise build a template plan on the fly. */
export function demoBundle(name: DemoName): { bundle: PlanBundleT; source: "ai" | "template" } {
  const golden = loadGolden(name);
  if (golden) return { bundle: golden, source: "ai" };

  const profile = fixtures[name];
  const now = new Date();
  const metrics = computeMetrics(profile, { now });
  let plan = templatePlan(profile, metrics, { now });
  for (const event of DEMO_EVENTS[name] ?? []) plan = applyProgress(plan, event).plan;
  return { bundle: { profile, plan, metrics }, source: "template" };
}

function loadGolden(name: DemoName): PlanBundleT | null {
  const candidates = [
    path.resolve(process.cwd(), "../../evals/golden", `${name}.json`),
    path.resolve(process.cwd(), "evals/golden", `${name}.json`),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const raw = JSON.parse(readFileSync(file, "utf8")) as { source?: string };
      if (raw.source !== "ai") return null;
      const parsed = PlanBundle.safeParse(raw);
      if (parsed.success) return parsed.data;
    } catch {
      return null;
    }
  }
  return null;
}
