import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Mode-independent smoke tests: they read the plan the server actually produced
 * (template or model-generated) and assert against it, so the same suite runs
 * with or without an API key. In AI mode a run costs a few cents.
 */

const shots = "e2e/screenshots";
mkdirSync(shots, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

type Plan = {
  currentPriorityRegionId: string;
  nextStepId: string;
  regions: { id: string; exploreTitle: string; proTitle: string; status: string }[];
  steps: { id: string; regionId: string; title: string; status: string; metric?: { target: number } }[];
  bridges: { id: string }[];
};

async function currentPlan(page: Page): Promise<Plan> {
  const res = await page.request.get("/api/plan");
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { plan: Plan }).plan;
}

async function loadSarah(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "See Sarah's journey" }).click();
  await expect(page).toHaveURL(/\/map$/);
  return currentPlan(page);
}

test.describe("Free Me — hackathon MVP flow", () => {
  test("landing → Sarah demo → Explore map → Professional → region → progress unlocks", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("path to financial freedom");
    await shot(page, "01-landing");

    const plan = await loadSarah(page);
    const active = plan.regions.find((r) => r.id === plan.currentPriorityRegionId)!;
    const next = plan.steps.find((s) => s.id === plan.nextStepId)!;

    const map = page.getByRole("img", { name: /Your Freedom Map/ });
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("aria-label", new RegExp(`${plan.regions.length} regions, ${plan.bridges.length} bridges`));
    await expect(page.getByText("Your next step")).toBeVisible();
    await expect(page.getByText(next.title).first()).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, "02-explore-map");

    // The toggle: same plan, different face.
    await page.getByRole("radio", { name: /Professional/ }).click();
    await expect(page.getByText("Current position")).toBeVisible();
    await expect(page.getByText("Emergency fund", { exact: true })).toBeVisible();
    await expect(page.getByText(/Priority 1 ·/)).toBeVisible();
    await expect(page.getByText(active.proTitle).first()).toBeVisible();
    await shot(page, "03-professional");

    await page.getByRole("radio", { name: /Explore/ }).click();
    await expect(map).toBeVisible();

    // Region detail for the active priority.
    await page.getByRole("button", { name: new RegExp(`^${escape(active.exploreTitle)},`) }).click();
    await expect(page).toHaveURL(new RegExp(`/map/${active.id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(active.exploreTitle);
    await shot(page, "04-region-active");

    // "Why?" answers from the plan (template mode) or the model (AI mode).
    await page.getByRole("button", { name: /explain it for me/ }).click();
    await expect(page.getByText(/From your plan|Explained for you/)).toBeVisible({ timeout: 45_000 });

    // Finish every open step in the active region → region complete → something unlocks.
    const open = plan.steps.filter((s) => s.regionId === active.id && s.status !== "done");
    expect(open.length).toBeGreaterThan(0);
    for (const step of open) {
      // Controlled input: it flips only after the progress mutation returns, so click and wait.
      const box = page.getByRole("checkbox", { name: new RegExp(`^Mark ${escape(step.title)} `) });
      await box.click();
      await expect(box).toBeChecked({ timeout: 15_000 });
    }
    await expect(page.getByRole("status")).toContainText(/Bridge unlocked|complete/);
    await shot(page, "05-region-complete");

    // Back on the map the next step has moved on.
    const after = await currentPlan(page);
    expect(after.currentPriorityRegionId).not.toBe(active.id);
    await page.goto("/map");
    await expect(page.getByText(after.steps.find((s) => s.id === after.nextStepId)!.title).first()).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, "06-map-after-unlock");

    expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("onboarding with Sarah's numbers builds a map", async ({ page }) => {
    test.setTimeout(360_000); // a full model generation at high effort can take 1–3 minutes
    await page.goto("/onboarding/freedom");
    await page.getByPlaceholder("For me, freedom means…").fill("I want to be able to travel without worrying about money.");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page).toHaveURL(/\/onboarding\/situation$/);
    await shot(page, "07-onboarding-situation");

    await page.getByLabel("Your age").fill("21");
    await page.getByRole("radio", { name: "🎓 Student" }).click();
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("Monthly income").fill("1800");
    await page.getByLabel("Monthly expenses").fill("1500");
    await page.getByLabel("Savings").fill("800");
    await page.getByLabel("Debt").fill("0");
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("What is it?").fill("Trip to Japan");
    await page.getByLabel("Target amount").fill("6000");
    await page.getByLabel("By when").fill("2028-03-01");
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByRole("radio", { name: /^Beginner/ }).click();
    await page.getByRole("radio", { name: /^Moderate/ }).click();
    await shot(page, "08-onboarding-final");
    await page.getByRole("button", { name: /Create my Freedom Profile/ }).click();

    await expect(page).toHaveURL(/\/map$/, { timeout: 300_000 });
    await expect(page.getByRole("img", { name: /Your Freedom Map/ })).toBeVisible();
    await expect(page.getByText("Your next step")).toBeVisible();
    const plan = await currentPlan(page);
    expect(plan.regions.some((r) => r.exploreTitle.includes("Japan"))).toBe(true);
    await page.waitForTimeout(1200);
    await shot(page, "09-map-from-onboarding");
  });

  test("lesson personalisation streams and allocation keeps the total", async ({ page }) => {
    test.setTimeout(300_000);
    await loadSarah(page);

    await page.goto("/lessons/emergency-fund");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("emergency buffer");
    await page.getByRole("button", { name: "Personalise for me" }).click();
    await expect(page.getByRole("button", { name: /Personalise again/ })).toBeVisible({ timeout: 120_000 });
    await expect(page.locator("article")).toContainText(/What this means for you/i);
    await shot(page, "10-lesson-personalised");

    await page.goto("/allocate");
    await page.getByLabel(/Amount/).fill("1000");
    await page.getByRole("button", { name: "Suggest a split" }).click();
    await expect(page.getByText(/\$1,000 across/)).toBeVisible({ timeout: 60_000 });
    await shot(page, "11-allocate");
    await page.getByRole("button", { name: "Save to my plan" }).click();
    await expect(page.getByRole("button", { name: "Saved ✓" })).toBeVisible();
  });

  test("learn index and dev map render", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("link", { name: /Budgeting basics/ })).toBeVisible();
    await page.goto("/dev/map");
    await expect(page.getByRole("img", { name: /Your Freedom Map/ }).first()).toBeVisible();
    await shot(page, "12-dev-map");
  });
});

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
