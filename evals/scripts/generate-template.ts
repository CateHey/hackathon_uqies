/**
 * Write template (no-AI) golden plans for every profile. Free, instant, deterministic.
 * Useful for local development and as the demo fallback until real goldens exist:
 *   pnpm eval:template
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { computeMetrics, FIXTURE_NOW, templatePlan } from "@free-me/core";
import { profileNames, profiles, type GoldenFile } from "../profiles";

async function main() {
  const outDir = path.resolve(import.meta.dirname, "../golden");
  await mkdir(outDir, { recursive: true });
  for (const name of profileNames) {
    const profile = profiles[name];
    const metrics = computeMetrics(profile, { now: FIXTURE_NOW });
    const plan = templatePlan(profile, metrics, { now: FIXTURE_NOW });
    const golden: GoldenFile = {
      name,
      source: "template",
      generatedAt: FIXTURE_NOW.toISOString(),
      profile,
      metrics,
      plan,
      attempts: 0,
    };
    await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(golden, null, 2));
    console.log(`${name}: template plan → ${plan.regions.length} regions, ${plan.steps.length} steps, priority ${plan.currentPriorityRegionId}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
