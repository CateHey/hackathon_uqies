"use client";

import { motion } from "framer-motion";
import type { Bridge, BridgePath as BridgePathT } from "@free-me/core";
import { statusLabel } from "@/lib/status";

/** A connection between two places. Open ones are solid gold; the rest are simply not drawn in yet. */
export function BridgePath({
  path,
  bridge,
  index,
  onHover,
  staticRender = false,
}: {
  path: BridgePathT;
  bridge: Bridge;
  index: number;
  onHover?: (bridge: Bridge | null) => void;
  /** Render final state with no draw-in animation (server/static output). */
  staticRender?: boolean;
}) {
  const open = bridge.status === "unlocked";
  return (
    <g
      onMouseEnter={() => onHover?.(bridge)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(bridge)}
      onBlur={() => onHover?.(null)}
      tabIndex={0}
      aria-label={`Connection ${statusLabel(bridge.status)}: ${bridge.relationship}`}
      className="outline-none"
    >
      <title>{bridge.relationship}</title>
      <path d={path.path} fill="none" stroke="transparent" strokeWidth={18} />
      {open ? (
        <motion.path
          key={`${bridge.id}-open`}
          d={path.path}
          fill="none"
          stroke="#FF7A1A"
          strokeWidth={3}
          strokeLinecap="round"
          initial={staticRender ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.08 * index, ease: "easeInOut" }}
        />
      ) : (
        <motion.path
          key={`${bridge.id}-pending`}
          d={path.path}
          fill="none"
          stroke="#5a6b7d"
          strokeWidth={2}
          strokeDasharray="6 7"
          strokeLinecap="round"
          initial={staticRender ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.08 * index }}
        />
      )}
    </g>
  );
}
