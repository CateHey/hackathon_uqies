/**
 * Render a demo persona's Freedom Map to a standalone SVG file — a quick visual
 * check without a browser:  pnpm --filter web render-map sarah horizontal out.svg
 */
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { DemoName, type Orientation } from "@free-me/core";
import { demoBundle } from "../lib/demo";
import { FreedomMapSvg } from "../components/explore/freedom-map-svg";

const [nameArg = "sarah", orientationArg = "horizontal", out = "freedom-map.svg"] = process.argv.slice(2);
const name = DemoName.parse(nameArg);
const orientation = orientationArg as Orientation;
const { bundle, source } = demoBundle(name);

const inner = renderToStaticMarkup(<FreedomMapSvg plan={bundle.plan} orientation={orientation} staticRender />);
const viewBox = inner.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1000 600";
const [, , w, h] = viewBox.split(" ").map(Number);
const body = inner.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}" font-family="Inter, Segoe UI, system-ui, sans-serif">
  <style>svg { --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; }</style>
  <rect width="${w}" height="${h}" fill="#0f1720"/>
  <text x="24" y="34" font-size="20" fill="#F6F1E7" style="font-family: var(--font-display)">🚀 ${name}'s Freedom Map</text>
  <text x="24" y="54" font-size="11" fill="#94A3B8">${bundle.plan.profileSummary.headline} · ${source} plan · next: ${bundle.plan.steps.find((s) => s.id === bundle.plan.nextStepId)?.title ?? ""}</text>
  ${body}
</svg>`;

writeFileSync(out, svg);
console.log(`wrote ${out} (${w}×${h}, ${bundle.plan.regions.length} regions, ${bundle.plan.bridges.length} bridges)`);
