"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { Bridge, PlanBundle } from "@free-me/core";
import { regionColors } from "@free-me/tokens";
import { useMediaQuery } from "@/lib/use-media-query";
import { NextStepBanner } from "../next-step-banner";
import { FreedomMapSvg } from "./freedom-map-svg";

/** 🎮 Explore mode: the world map with pan/zoom, the next-step banner and a legend. */
export function ExploreMap({ bundle }: { bundle: PlanBundle }) {
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 1024px)", true);
  const [hover, setHover] = useState<Bridge | null>(null);
  const { plan } = bundle;

  return (
    <div className="space-y-4">
      <NextStepBanner plan={plan} />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top,#141b22_0%,#0b1014_65%)]">
        <TransformWrapper minScale={0.6} maxScale={2.5} centerOnInit wheel={{ step: 0.08 }} doubleClick={{ disabled: true }}>
          {({ resetTransform, zoomIn, zoomOut }) => (
            <>
              <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full border border-white/10 bg-ink/80 p-1 text-sm">
                <button className="rounded-full px-3 py-1 hover:bg-white/10" onClick={() => zoomOut()} aria-label="Zoom out">−</button>
                <button className="rounded-full px-3 py-1 hover:bg-white/10" onClick={() => zoomIn()} aria-label="Zoom in">+</button>
                <button className="rounded-full px-3 py-1 hover:bg-white/10" onClick={() => resetTransform()}>Recentre</button>
              </div>
              {hover && (
                <div className="absolute left-3 top-3 z-10 max-w-sm rounded-xl border border-accent/30 bg-ink/90 p-3 text-sm text-parchment shadow-lg">
                  <span className="mr-1">🌉</span>
                  {hover.relationship}
                  {hover.status === "locked" && <span className="mt-1 block text-xs text-mist">Unlocks when you: {hover.requirement}</span>}
                </div>
              )}
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%" }}>
                <div className="w-full p-4 sm:p-8">
                  <FreedomMapSvg
                    plan={plan}
                    orientation={wide ? "horizontal" : "vertical"}
                    onSelect={(id) => router.push(`/map/${id}`)}
                    onHoverBridge={setHover}
                  />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["foundation", "Foundation"],
    ["security", "Security"],
    ["growth", "Growth"],
    ["personal_goal", "Your goals"],
    ["markets", "Markets"],
    ["property", "Property"],
    ["business", "Business"],
    ["digital_assets", "Digital assets"],
    ["freedom_city", "Freedom City"],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist">
      {items.map(([key, label]) => (
        <li key={key} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: regionColors[key as keyof typeof regionColors] }} />
          {label}
        </li>
      ))}
      <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent" /> Bridge open</li>
      <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 border-t border-dashed border-mist" /> Bridge locked</li>
    </ul>
  );
}
