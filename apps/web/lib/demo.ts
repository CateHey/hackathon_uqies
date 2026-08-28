import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  applyProgress,
  computeMetrics,
  fixtures,
  PlanBundle,
  templatePlan,
  type DemoName,
  type FreedomPlan,
  type PlanBundle as PlanBundleT,
} from "@free-me/core";

/**
 * A little history so the demo personas don't all start at square one: regions
 * listed here have every step marked done. Works for template and AI plans alike
 * because it goes by region type, not step ids (the model names its own steps).
 */
const DEMO_COMPLETED_REGIONS: Partial<Record<DemoName, string[]>> = {
  sarah: ["foundation"],
};

/** Prefer a real AI golden plan when one has been generated; otherwise build a template plan on the fly. */
export function demoBundle(name: DemoName): { bundle: PlanBundleT; source: "ai" | "template" } {
  const golden = loadGolden(name);
  if (golden) return { bundle: { ...golden, plan: withDemoHistory(name, golden.plan) }, source: "ai" };

  const profile = fixtures[name];
  const now = new Date();
  const metrics = computeMetrics(profile, { now });
  const plan = withDemoHistory(name, templatePlan(profile, metrics, { now }));
  return { bundle: { profile, plan, metrics }, source: "template" };
}

function withDemoHistory(name: DemoName, plan: FreedomPlan): FreedomPlan {
  let out = plan;
  for (const regionType of DEMO_COMPLETED_REGIONS[name] ?? []) {
    for (const step of out.steps.filter((s) => s.regionId === regionType && s.status !== "done")) {
      out = applyProgress(out, { type: "step_status", stepId: step.id, status: "done" }).plan;
    }
  }
  return out;
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
