"use client";

import { motion } from "framer-motion";
import type { Bridge, BridgePath as BridgePathT } from "@free-me/core";

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
  staticRender?: boolean;
}) {
  const unlocked = bridge.status === "unlocked";
  return (
    <g
      onMouseEnter={() => onHover?.(bridge)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(bridge)}
      onBlur={() => onHover?.(null)}
      tabIndex={0}
      aria-label={`Bridge ${bridge.status}: ${bridge.relationship}`}
      className="outline-none"
    >
      <title>{bridge.relationship}</title>
      <path d={path.path} fill="none" stroke="transparent" strokeWidth={18} />
      {unlocked ? (
        <motion.path
          key={`${bridge.id}-unlocked`}
          d={path.path}
          fill="none"
          stroke="#C9A227"
          strokeWidth={3}
          strokeLinecap="round"
          initial={staticRender ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.08 * index, ease: "easeInOut" }}
        />
      ) : (
        <motion.path
          key={`${bridge.id}-locked`}
          d={path.path}
          fill="none"
          stroke="#3b4757"
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
