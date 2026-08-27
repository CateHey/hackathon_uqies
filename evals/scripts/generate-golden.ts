/**
 * Regenerate golden plans with the real model. COSTS MONEY — run deliberately:
 *   pnpm eval:golden
 * Needs ANTHROPIC_API_KEY in evals/.env or the environment.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FIXTURE_NOW } from "@free-me/core";
import { createAnthropicClient, estimateCostUsd, generatePlan, zeroUsage, addUsage } from "@free-me/ai";
import { profileNames, profiles, type GoldenFile } from "../profiles";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Put it in evals/.env (see evals/.env.example).");
    process.exit(1);
  }
  const only = process.argv.slice(2);
  const names = only.length ? profileNames.filter((n) => only.includes(n)) : profileNames;
  const client = createAnthropicClient();
  const outDir = path.resolve(import.meta.dirname, "../golden");
  await mkdir(outDir, { recursive: true });
  const total = zeroUsage();

  for (const name of names) {
    const started = Date.now();
    process.stdout.write(`${name}: generating… `);
    const result = await generatePlan(profiles[name], { client, now: FIXTURE_NOW });
    addUsage(total, result.usage);
    const golden: GoldenFile = {
      name,
      source: result.source,
      generatedAt: new Date().toISOString(),
      profile: profiles[name],
      metrics: result.metrics,
      plan: result.plan,
      usage: result.usage,
      attempts: result.attempts,
      ...(result.problems ? { problems: result.problems } : {}),
    };
    await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(golden, null, 2));
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      `${result.source} in ${result.attempts} attempt(s), ${secs}s, ${result.usage.inputTokens} in / ${result.usage.outputTokens} out (cache read ${result.usage.cacheReadTokens})` +
        (result.problems ? `\n  problems: ${result.problems.join("; ")}` : ""),
    );
  }

  console.log(
    `\nTotal: ${total.inputTokens} input, ${total.outputTokens} output, ${total.cacheReadTokens} cache-read tokens ≈ $${estimateCostUsd(total).toFixed(3)} USD`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
