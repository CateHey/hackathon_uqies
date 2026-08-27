import { DemoName } from "@free-me/core";
import { ApiError, handle, json } from "@/lib/api";
import { demoBundle } from "@/lib/demo";
import { loadSession, saveSession } from "@/lib/session";

type Ctx = { params: Promise<{ name: string }> };

/** Load a demo persona (Sarah etc.) into the current session — the stage-safe path. */
export const POST = handle<Ctx>(async (_req, { params }) => {
  const { name } = await params;
  const parsed = DemoName.safeParse(name);
  if (!parsed.success) throw new ApiError(404, "not_found", `No demo persona called "${name}".`);

  const { bundle, source } = demoBundle(parsed.data);
  const session = await loadSession();
  session.profile = bundle.profile;
  session.plan = bundle.plan;
  session.metrics = bundle.metrics;
  session.planMode = "demo";
  session.events = [];
  session.pendingUpgrade = null;
  session.upgrade = null;
  session.upgradeError = null;
  await saveSession(session);

  return json({ ...bundle, source, attempts: 0, mode: "demo", pending: false });
});
