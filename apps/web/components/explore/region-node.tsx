"use client";

import { motion } from "framer-motion";
import { regionPlainLabel, type Region, type RegionBox } from "@free-me/core";
import { regionColors, regionEmoji } from "@free-me/tokens";
import { statusLabel } from "@/lib/status";
import { fitText, wrapTitleToWidth } from "./map-text";

const RING_R = 13;
const CIRC = 2 * Math.PI * RING_R;

/** Inner padding of a node box, in map units. The right pad clears the progress ring. */
const PAD_L = 16;
const PAD_R = 12;
const TITLE_INDENT = 44; // where the title starts when an emoji is drawn before it
const TITLE_SIZE = 12.5;
const CAPTION_SIZE = 9.5;
const CAPTION_TRACKING = 0.04;

/**
 * A place on the map. Nothing is drawn as locked: a region the plan hasn't opened yet
 * reads as "Pending" — dimmer and outlined, but legible, clickable, and showing whatever
 * progress it already has, so the world visibly fills in as you go.
 */
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
  // Titles like "🌴 Freedom City" bring their own emoji — don't draw the type emoji twice.
  const emoji = /^\p{Extended_Pictographic}/u.test(region.exploreTitle) ? "" : regionEmoji[region.type];
  const pending = region.status === "locked";
  const active = region.status === "active";
  const complete = region.status === "complete";
  const titleX = box.x + (emoji ? TITLE_INDENT : PAD_L);
  const lines = wrapTitleToWidth(region.exploreTitle, box.x + box.w - PAD_R - titleX, TITLE_SIZE);
  const caption = fitText(regionPlainLabel(region.type).toUpperCase(), box.w - PAD_L - PAD_R, CAPTION_SIZE, {
    upper: true,
    letterSpacing: CAPTION_TRACKING,
  });
  const ringX = box.x + box.w - 22;
  const ringY = box.y + box.h - 22;
  const percent = Math.round(region.progress * 100);

  return (
    <motion.g
      initial={staticRender ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.45 }}
      role="button"
      tabIndex={0}
      aria-label={`${region.exploreTitle} — ${regionPlainLabel(region.type)}, ${statusLabel(region.status)}, ${percent}% complete`}
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
        fill="#141b22"
        stroke={active ? "#FF7A1A" : selected ? "#F4F6F5" : color}
        strokeWidth={active || selected ? 2.5 : 1.25}
        strokeOpacity={pending ? 0.55 : 1}
      />
      <rect x={box.x} y={box.y + 12} width={5} height={box.h - 24} rx={2.5} fill={color} opacity={pending ? 0.6 : 1} />
      {emoji && (
        <text x={box.x + 16} y={box.y + 32} fontSize={20} opacity={pending ? 0.8 : 1}>
          {emoji}
        </text>
      )}
      {lines.map((line, i) => (
        <text
          key={line}
          x={titleX}
          y={box.y + 26 + i * 16}
          fontSize={TITLE_SIZE}
          fontWeight={600}
          fill="#F4F6F5"
          fillOpacity={pending ? 0.8 : 1}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {line}
        </text>
      ))}
      {/* Plain-language caption: what this place is actually about. */}
      <text
        x={box.x + PAD_L}
        y={box.y + 26 + lines.length * 16 + 2}
        fontSize={CAPTION_SIZE}
        fill="#8B97A6"
        style={{ letterSpacing: `${CAPTION_TRACKING}em` }}
      >
        {caption}
      </text>
      {complete ? (
        <text x={box.x + 16} y={box.y + box.h - 16} fontSize={11} fill="#17A34A" fontWeight={600}>
          ✓ Complete
        </text>
      ) : (
        <text x={box.x + 16} y={box.y + box.h - 16} fontSize={11} fill="#8B97A6">
          {pending ? "Pending" : `${percent}%`} · {"★".repeat(region.relevance)}
          <tspan fillOpacity={0.35}>{"★".repeat(5 - region.relevance)}</tspan>
        </text>
      )}
      {/* The ring is drawn for every unfinished region, so progress shows up wherever it is made. */}
      {!complete && (
        <>
          <circle cx={ringX} cy={ringY} r={RING_R} fill="none" stroke="#1F2A33" strokeWidth={4} />
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
