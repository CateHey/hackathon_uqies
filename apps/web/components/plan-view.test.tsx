/**
 * Both renderers read the same plan: whatever the Professional view lists must be
 * on the Explore map, and vice versa. Rendered to static HTML — no browser needed.
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { computeMetrics, FIXTURE_NOW, fixtures, templatePlan, type PlanBundle } from "@free-me/core";
import { FreedomMapSvg } from "./explore/freedom-map-svg";
import { ProfessionalPlan } from "./professional/professional-plan";
import { Markdown } from "./markdown";
import { wrapTitle } from "./explore/map-text";

const bundle = (): PlanBundle => {
  const profile = fixtures.sarah;
  const metrics = computeMetrics(profile, { now: FIXTURE_NOW });
  return { profile, metrics, plan: templatePlan(profile, metrics, { now: FIXTURE_NOW }) };
};

const decode = (html: string) =>
  html.replace(/<!--.*?-->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

describe("Explore and Professional render the same plan", () => {
  it("every region appears in both views with its own title", () => {
    const b = bundle();
    const explore = decode(renderToString(<FreedomMapSvg plan={b.plan} orientation="horizontal" />));
    const pro = decode(renderToString(<ProfessionalPlan bundle={b} />));
    for (const r of b.plan.regions) {
      for (const line of wrapTitle(r.exploreTitle, 16)) expect(explore, `explore: ${r.id}`).toContain(line.replace(/…$/, ""));
      expect(pro, `pro: ${r.id}`).toContain(r.proTitle);
      expect(pro).toContain(r.why.slice(0, 40));
    }
    expect(explore).toContain(`${b.plan.bridges.length} bridges`);
    expect(pro).toContain(b.plan.freedomCity.title);
    expect(pro).toContain("Emergency fund");
    expect(pro).toContain("$3,000");
    // Nothing in either view is presented as locked.
    expect(pro).not.toContain("Locked");
    expect(explore).not.toContain("Locked");
  });

  it("the next step shows up in Professional mode as priority 1", () => {
    const b = bundle();
    const next = b.plan.steps.find((s) => s.id === b.plan.nextStepId)!;
    const pro = decode(renderToString(<ProfessionalPlan bundle={b} />));
    expect(pro).toContain("Priority 1");
    expect(pro).toContain(next.title);
  });

  it("the map renders vertically too, with not-yet-opened regions shown as pending — never locked", () => {
    const b = bundle();
    const svg = renderToString(<FreedomMapSvg plan={b.plan} orientation="vertical" />);
    expect(svg).toContain("Pending");
    expect(svg).not.toContain("🔒");
    expect(svg).not.toContain("Locked");
    expect(svg.match(/<path d="M/g)?.length).toBeGreaterThanOrEqual(b.plan.bridges.length);
  });
});

describe("Markdown", () => {
  it("renders headings, lists and inline marks without raw HTML", () => {
    const html = renderToString(<Markdown text={"## Title\n\nSome **bold** and *it*.\n\n- a\n- b\n\n1. x\n2. y\n\n<script>alert(1)</script>"} />);
    expect(html).toContain("<h2");
    expect(html).toContain("<strong");
    expect(html).toContain("<em>");
    expect(html).toContain("<ul");
    expect(html).toContain("<ol");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("wrapTitle", () => {
  it("wraps long titles into two lines and truncates the rest", () => {
    expect(wrapTitle("Foundation Village")).toEqual(["Foundation Village"]);
    expect(wrapTitle("Trip to Japan Destination")).toEqual(["Trip to Japan", "Destination"]);
    expect(wrapTitle("A very very long goal name that keeps going", 12).length).toBe(2);
    expect(wrapTitle("A very very long goal name that keeps going", 12)[1]).toMatch(/…$/);
  });
});
