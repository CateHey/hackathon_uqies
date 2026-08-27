"use client";

import type { PlanBundle } from "@free-me/core";
import { FreedomMapSvg } from "../explore/freedom-map-svg";

export function DevMaps({ bundles }: { bundles: { name: string; bundle: PlanBundle; source: string }[] }) {
  return (
    <div className="space-y-10">
      {bundles.map(({ name, bundle, source }) => (
        <section key={name} className="space-y-3">
          <h2 className="font-display text-2xl">
            {name} <span className="text-sm text-mist">({source} · priority {bundle.plan.currentPriorityRegionId})</span>
          </h2>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-white/10 p-4">
              <FreedomMapSvg plan={bundle.plan} orientation="horizontal" />
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <FreedomMapSvg plan={bundle.plan} orientation="vertical" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
