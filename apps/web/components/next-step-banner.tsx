"use client";

import Link from "next/link";
import { useState } from "react";
import type { FreedomPlan } from "@free-me/core";
import { useUiStore } from "@/lib/store";

export function NextStepBanner({ plan }: { plan: FreedomPlan }) {
  const mode = useUiStore((s) => s.mode);
  const [open, setOpen] = useState(false);
  const step = plan.steps.find((s) => s.id === plan.nextStepId);
  const region = step && plan.regions.find((r) => r.id === step.regionId);
  if (!step || !region) return null;
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Your next step</p>
          <p className="mt-1 font-display text-xl text-parchment">{step.title}</p>
          <p className="text-sm text-mist">in {mode === "explore" ? region.exploreTitle : region.proTitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setOpen((o) => !o)} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
            Why?
          </button>
          <Link href={`/map/${region.id}`} className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft">
            Open →
          </Link>
        </div>
      </div>
      {open && <p className="mt-3 text-sm text-parchment/90">{step.why}</p>}
    </div>
  );
}
