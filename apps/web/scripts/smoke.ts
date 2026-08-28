/**
 * Production smoke test — drives the public API of a deployed Free Me the way the app does.
 *   pnpm smoke https://your-deployment.vercel.app
 * Loads a demo persona, reads the plan, asks "Why?" and reports what the server says.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
let cookie = "";

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0] ?? cookie;
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body };
}

function line(ok: boolean, label: string, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  console.log(`Smoke test against ${base}\n`);
  let allOk = true;

  const health = await call("/health");
  const h = health.body as { ok?: boolean; mode?: string; db?: string; dbReady?: boolean; dbError?: string | null; auth?: boolean; version?: string };
  allOk = line(health.status === 200 && Boolean(h.ok), "health", `mode=${h.mode} db=${h.db} ready=${h.dbReady} auth=${h.auth} version=${h.version}${h.dbError ? ` error=${h.dbError}` : ""}`) && allOk;

  const demo = await call("/demo/sarah", { method: "POST" });
  const d = demo.body as { plan?: { regions?: unknown[]; source?: string; currentPriorityRegionId?: string } };
  allOk = line(demo.status === 200 && Array.isArray(d.plan?.regions), "load Sarah's demo journey", `source=${d.plan?.source} regions=${d.plan?.regions?.length} priority=${d.plan?.currentPriorityRegionId}`) && allOk;

  const plan = await call("/plan");
  const p = plan.body as { plan?: { nextStepId?: string } };
  allOk = line(plan.status === 200 && Boolean(p.plan?.nextStepId), "session persists across requests", `nextStep=${p.plan?.nextStepId}`) && allOk;

  const why = await call("/plan/why", { method: "POST", body: JSON.stringify({ itemType: "region", itemId: "security" }) });
  const w = why.body as { source?: string; explanation?: string };
  allOk = line(why.status === 200 && Boolean(w.explanation), "Why? explanation", `source=${w.source} (${w.explanation?.slice(0, 60)}…)`) && allOk;

  const status = await call("/plan/status");
  allOk = line(status.status === 200, "plan status endpoint", JSON.stringify(status.body)) && allOk;

  const lesson = await call("/lessons/emergency-fund");
  const l = lesson.body as { title?: string };
  allOk = line(lesson.status === 200 && Boolean(l.title), "lesson catalogue", l.title ?? "") && allOk;

  console.log(`\n${allOk ? "All good." : "Something is off — see above."}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
