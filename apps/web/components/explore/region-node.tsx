"use client";

import { motion } from "framer-motion";
import type { Region, RegionBox } from "@free-me/core";
import { regionColors, regionEmoji } from "@free-me/tokens";
import { wrapTitle } from "./map-text";

const RING_R = 13;
const CIRC = 2 * Math.PI * RING_R;

export function RegionNode({
  box,
  region,
  index,
  selected,
  onSelect,
  staticRender = false,
}: {
  box: RegionBox;
  region: Region;
  index: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** Render final state with no entrance animation (server/static output). */
  staticRender?: boolean;
}) {
  const color = regionColors[region.type];
  const emoji = regionEmoji[region.type];
  const locked = region.status === "locked";
  const active = region.status === "active";
  const complete = region.status === "complete";
  const lines = wrapTitle(region.exploreTitle, 16);
  const ringX = box.x + box.w - 22;
  const ringY = box.y + box.h - 22;

  return (
    <motion.g
      initial={staticRender ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.45 }}
      role="button"
      tabIndex={0}
      aria-label={`${region.exploreTitle}, ${region.status.replace("_", " ")}, ${Math.round(region.progress * 100)}% complete`}
      className="cursor-pointer outline-none"
      onClick={() => onSelect?.(region.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(region.id);
        }
      }}
    >
      {region.type === "freedom_city" && (
        <circle cx={box.cx} cy={box.cy} r={box.w * 0.85} fill="url(#fm-city-glow)" pointerEvents="none" />
      )}
      {active && (
        <rect x={box.x - 8} y={box.y - 8} width={box.w + 16} height={box.h + 16} rx={22} fill={color} opacity={0.35} filter="url(#fm-glow)" />
      )}
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={16}
        fill={locked ? "#121a24" : "#1b2430"}
        stroke={active ? "#C9A227" : selected ? "#F6F1E7" : color}
        strokeWidth={active || selected ? 2.5 : 1.25}
        strokeDasharray={locked ? "5 4" : undefined}
        opacity={locked ? 0.75 : 1}
      />
      <rect x={box.x} y={box.y + 12} width={5} height={box.h - 24} rx={2.5} fill={color} opacity={locked ? 0.35 : 1} />
      <text x={box.x + 16} y={box.y + 32} fontSize={20} opacity={locked ? 0.5 : 1}>
        {emoji}
      </text>
      {lines.map((line, i) => (
        <text
          key={line}
          x={box.x + 44}
          y={box.y + 26 + i * 16}
          fontSize={12.5}
          fontWeight={600}
          fill={locked ? "#94A3B8" : "#F6F1E7"}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {line}
        </text>
      ))}
      {locked ? (
        <text x={box.x + 16} y={box.y + box.h - 16} fontSize={11} fill="#94A3B8">
          🔒 Locked · {"★".repeat(region.relevance)}
          <tspan fill="#3b4757">{"★".repeat(5 - region.relevance)}</tspan>
        </text>
      ) : complete ? (
        <text x={box.x + 16} y={box.y + box.h - 16} fontSize={11} fill="#6B8F71" fontWeight={600}>
          ✓ Complete
        </text>
      ) : (
        <>
          <text x={box.x + 16} y={box.y + box.h - 16} fontSize={11} fill="#94A3B8">
            {Math.round(region.progress * 100)}% · {"★".repeat(region.relevance)}
          </text>
          <circle cx={ringX} cy={ringY} r={RING_R} fill="none" stroke="#2A3542" strokeWidth={4} />
          <motion.circle
            cx={ringX}
            cy={ringY}
            r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={staticRender ? false : { strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC * (1 - region.progress) }}
            transition={{ duration: 0.9, delay: 0.2 + 0.05 * index }}
            transform={`rotate(-90 ${ringX} ${ringY})`}
          />
        </>
      )}
    </motion.g>
  );
}
