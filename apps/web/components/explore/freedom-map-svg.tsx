"use client";

import { useMemo } from "react";
import { layoutFreedomMap, type Bridge, type FreedomPlan, type Orientation } from "@free-me/core";
import { BridgePath } from "./bridge-path";
import { RegionNode } from "./region-node";

/**
 * The pure map: plan + orientation in, SVG out. No data fetching, no zoom — so it can be
 * rendered on the server, in tests, and inside any wrapper.
 */
export function FreedomMapSvg({
  plan,
  orientation,
  selectedId,
  onSelect,
  onHoverBridge,
  staticRender = false,
}: {
  plan: FreedomPlan;
  orientation: Orientation;
  selectedId?: string;
  onSelect?: (regionId: string) => void;
  onHoverBridge?: (bridge: Bridge | null) => void;
  /** Final state only, no entrance animations — for static/server output. */
  staticRender?: boolean;
}) {
  const layout = useMemo(() => layoutFreedomMap(plan, { orientation }), [plan, orientation]);
  const regionById = useMemo(() => new Map(plan.regions.map((r) => [r.id, r])), [plan.regions]);
  const bridgeById = useMemo(() => new Map(plan.bridges.map((b) => [b.id, b])), [plan.bridges]);

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Your Freedom Map: ${plan.regions.length} regions, ${plan.bridges.length} bridges`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="fm-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="fm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeOpacity="0.035" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={layout.width} height={layout.height} fill="url(#fm-grid)" />
      <g>
        {layout.bridges.map((p, i) => {
          const bridge = bridgeById.get(p.id);
          return bridge ? (
            <BridgePath key={p.id} path={p} bridge={bridge} index={i} onHover={onHoverBridge} staticRender={staticRender} />
          ) : null;
        })}
      </g>
      <g>
        {layout.regions.map((box, i) => {
          const region = regionById.get(box.id);
          return region ? (
            <RegionNode
              key={box.id}
              box={box}
              region={region}
              index={i}
              selected={box.id === selectedId}
              onSelect={onSelect}
              staticRender={staticRender}
            />
          ) : null;
        })}
      </g>
    </svg>
  );
}
