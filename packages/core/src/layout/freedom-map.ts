import type { BridgeStatus, FreedomPlan, Region, RegionType } from "../schema/plan";
import { orderRegions, SPINE } from "./order";

export type Orientation = "horizontal" | "vertical";

export interface RegionBox {
  id: string;
  type: RegionType;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  lane: "spine" | "branch" | "city";
}

export interface BridgePath {
  id: string;
  from: string;
  to: string;
  status: BridgeStatus;
  /** SVG path data (cubic Bézier). */
  path: string;
}

export interface MapLayout {
  orientation: Orientation;
  width: number;
  height: number;
  regions: RegionBox[];
  bridges: BridgePath[];
}

/**
 * Node size in map units. The width has to hold the longest plain-language caption
 * ("Side income & business") at its drawn size without the renderer having to truncate it.
 */
export const BOX_W = 184;
export const BOX_H = 96;

const SPINE_START = 120;
/** Centre-to-centre along the spine — BOX_W plus a gutter wide enough for the bridges. */
const SPINE_GAP = 216;

/**
 * Deterministic positions for the Freedom Map in an abstract coordinate space.
 * Both clients import this; each scales the result to its own canvas.
 *
 * Horizontal (wide screens): spine left→right, branches stacked in one column, city at the far right.
 * Vertical (phones): spine top→bottom, branches in a two-column grid, city at the bottom.
 */
export function layoutFreedomMap(plan: FreedomPlan, opts: { orientation: Orientation }): MapLayout {
  const { orientation } = opts;
  const ordered = orderRegions(plan);
  const spine = SPINE.flatMap((t) => ordered.filter((r) => r.type === t));
  const branches = ordered.filter((r) => !SPINE.includes(r.type) && r.type !== "freedom_city");
  const cities = ordered.filter((r) => r.type === "freedom_city");

  type Placed = { region: Region; a: number; b: number; lane: RegionBox["lane"] };
  const placed: Placed[] = [];

  spine.forEach((r, i) => placed.push({ region: r, a: SPINE_START + i * SPINE_GAP, b: 0, lane: "spine" }));
  const branchStart = SPINE_START + Math.max(spine.length, 1) * SPINE_GAP + 60;

  let cityA: number;
  if (orientation === "horizontal") {
    const gap = 128;
    const total = (branches.length - 1) * gap;
    branches.forEach((r, i) =>
      placed.push({ region: r, a: branchStart, b: -total / 2 + i * gap, lane: "branch" }),
    );
    cityA = branchStart + 230;
  } else {
    const colGap = 212;
    const rowGap = 124;
    const rows = Math.ceil(branches.length / 2);
    branches.forEach((r, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const inRow = Math.min(2, branches.length - row * 2);
      const b = inRow === 1 ? 0 : col === 0 ? -colGap / 2 : colGap / 2;
      placed.push({ region: r, a: branchStart + row * rowGap, b, lane: "branch" });
    });
    cityA = branchStart + Math.max(rows, 1) * rowGap + 80;
  }
  cities.forEach((r, i) => placed.push({ region: r, a: cityA, b: i * 130, lane: "city" }));

  const bs = placed.map((p) => p.b);
  const minB = bs.length ? Math.min(...bs) : 0;
  const maxB = bs.length ? Math.max(...bs) : 0;
  const acrossPad = orientation === "horizontal" ? BOX_H / 2 + 60 : BOX_W / 2 + 40;
  const acrossSize = Math.max(orientation === "horizontal" ? 620 : 420, maxB - minB + 2 * acrossPad);
  const bOffset = acrossSize / 2 - (minB + maxB) / 2;
  const alongSize = cityA + (orientation === "horizontal" ? BOX_W / 2 + 80 : BOX_H / 2 + 80);

  const regions: RegionBox[] = placed.map((p) => {
    const cx = orientation === "horizontal" ? p.a : p.b + bOffset;
    const cy = orientation === "horizontal" ? p.b + bOffset : p.a;
    return {
      id: p.region.id,
      type: p.region.type,
      cx: r1(cx),
      cy: r1(cy),
      x: r1(cx - BOX_W / 2),
      y: r1(cy - BOX_H / 2),
      w: BOX_W,
      h: BOX_H,
      lane: p.lane,
    };
  });

  const boxById = new Map(regions.map((b) => [b.id, b]));
  const bridges: BridgePath[] = plan.bridges.flatMap((b) => {
    const from = boxById.get(b.from);
    const to = boxById.get(b.to);
    if (!from || !to) return [];
    return [{ id: b.id, from: b.from, to: b.to, status: b.status, path: bezier(from, to, orientation) }];
  });

  return {
    orientation,
    width: Math.round(orientation === "horizontal" ? alongSize : acrossSize),
    height: Math.round(orientation === "horizontal" ? acrossSize : alongSize),
    regions,
    bridges,
  };
}

function bezier(from: RegionBox, to: RegionBox, orientation: Orientation): string {
  if (orientation === "horizontal") {
    const x1 = from.x + from.w;
    const y1 = from.cy;
    const x2 = to.x;
    const y2 = to.cy;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    return `M ${r1(x1)} ${r1(y1)} C ${r1(x1 + dx)} ${r1(y1)}, ${r1(x2 - dx)} ${r1(y2)}, ${r1(x2)} ${r1(y2)}`;
  }
  const x1 = from.cx;
  const y1 = from.y + from.h;
  const x2 = to.cx;
  const y2 = to.y;
  const dy = Math.max(40, Math.abs(y2 - y1) / 2);
  return `M ${r1(x1)} ${r1(y1)} C ${r1(x1)} ${r1(y1 + dy)}, ${r1(x2)} ${r1(y2 - dy)}, ${r1(x2)} ${r1(y2)}`;
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}
