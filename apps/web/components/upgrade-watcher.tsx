"use client";

import { useEffect, useRef, useState } from "react";
import { useApplyUpgrade, useGeneratePlan, usePlanStatus } from "@free-me/api-client";
import { Button } from "./ui";

/**
 * Sits above the map. While the model personalises the plan it shows a quiet
 * progress pill; when the upgrade is ready it swaps it in automatically (if the
 * person hasn't started ticking things off) or offers a button (if they have).
 */
export function UpgradeWatcher() {
  const status = usePlanStatus();
  const apply = useApplyUpgrade();
  const rebuild = useGeneratePlan();
  const [applied, setApplied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const attempted = useRef(false);
  const data = status.data;

  // Auto-apply once, only when nothing would be lost.
  useEffect(() => {
    if (!data?.upgradeReady || data.eventsSince !== 0 || attempted.current) return;
    attempted.current = true;
    apply.mutate(undefined, { onSuccess: () => setApplied(true) });
  }, [data, apply]);

  // The "ready" confirmation fades out on its own.
  useEffect(() => {
    if (!applied) return;
    const t = setTimeout(() => setDismissed(true), 9000);
    return () => clearTimeout(t);
  }, [applied]);

  // Edited numbers beat everything else: the map on screen is describing a situation that
  // no longer exists, and rebuilding is one click.
  if (data?.planStale) {
    return (
      <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-parchment">
        <span>
          ✏️ <strong className="font-semibold">Your numbers changed.</strong> This map was built from the old ones.
        </span>
        <Button disabled={rebuild.isPending} onClick={() => rebuild.mutate(undefined)}>
          {rebuild.isPending ? "Rebuilding…" : "Update my map"}
        </Button>
      </div>
    );
  }

  if (data?.pending) {
    return (
      <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl border border-accent-2/30 bg-accent-2/5 px-4 py-3 text-sm text-parchment">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-2" aria-hidden />
        <span>
          <strong className="font-semibold">Personalising your map…</strong> usually 1–3 minutes. Keep exploring — it will update itself.
        </span>
      </div>
    );
  }

  if (dismissed) return null;

  if (applied) {
    return (
      <div role="status" className="mb-4 rounded-2xl border border-accent-2/40 bg-accent-2/10 px-4 py-3 text-sm text-parchment">
        ✨ <strong className="font-semibold">Your personalised map is ready.</strong> Every region, bridge and step now reflects your situation.
        <button onClick={() => setDismissed(true)} className="ml-3 text-xs text-mist hover:text-parchment">dismiss</button>
      </div>
    );
  }

  if (data?.upgradeReady && data.eventsSince > 0) {
    return (
      <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-2/40 bg-accent-2/10 px-4 py-3 text-sm text-parchment">
        <span>
          ✨ <strong className="font-semibold">Your personalised map is ready.</strong> Switching replaces the starter plan (and the ticks you made on it).
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setDismissed(true)}>Keep starter</Button>
          <Button disabled={apply.isPending} onClick={() => apply.mutate(undefined, { onSuccess: () => setApplied(true) })}>
            {apply.isPending ? "Switching…" : "Show my personalised map"}
          </Button>
        </div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <p className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-mist">
        We couldn&apos;t personalise your map this time, so you&apos;re on the guided starter plan. Everything on it still comes from your numbers.
      </p>
    );
  }

  return null;
}
