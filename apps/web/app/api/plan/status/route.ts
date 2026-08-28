import { handle, json } from "@/lib/api";
import { loadSession } from "@/lib/session";

/** Is a personalised plan being built / ready for this session? Polled by the map. */
export const GET = handle(async () => {
  const s = await loadSession();
  return json(
    {
      pending: Boolean(s.pendingUpgrade),
      upgradeReady: Boolean(s.upgrade),
      planStale: Boolean(s.planStale),
      eventsSince: s.events.length,
      startedAt: s.pendingUpgrade?.startedAt ?? s.upgrade?.startedAt ?? null,
      error: s.upgradeError ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
});
