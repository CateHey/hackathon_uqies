import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const shots = "e2e/screenshots";
mkdirSync(shots, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

test.describe("Free Me — hackathon MVP flow", () => {
  test("landing → Sarah demo → Explore map → Professional → region → bridge unlock", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("path to financial freedom");
    await shot(page, "01-landing");

    await page.getByRole("button", { name: "See Sarah's journey" }).click();
    await expect(page).toHaveURL(/\/map$/);
    const map = page.getByRole("img", { name: /Your Freedom Map/ });
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("aria-label", /9 regions, 9 bridges/);
    await expect(page.getByText("Your next step")).toBeVisible();
    await expect(page.getByText("Build a 2-month emergency buffer")).toBeVisible();
    await page.waitForTimeout(1200); // let the entrance animations finish before the screenshot
    await shot(page, "02-explore-map");

    // The toggle: same plan, different face.
    await page.getByRole("radio", { name: /Professional/ }).click();
    await expect(page.getByText("Current position")).toBeVisible();
    await expect(page.getByText("Emergency fund", { exact: true })).toBeVisible();
    await expect(page.getByText("$3,000").first()).toBeVisible();
    await expect(page.getByText(/Priority 1 ·/)).toBeVisible();
    await shot(page, "03-professional");

    await page.getByRole("radio", { name: /Explore/ }).click();
    await expect(map).toBeVisible();

    // Region detail: Security Harbour is the active priority for the demo persona.
    await page.getByRole("button", { name: /Security Harbour/ }).click();
    await expect(page).toHaveURL(/\/map\/security$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Security Harbour");
    await expect(page.getByText("Emergency buffer:")).toBeVisible();
    await shot(page, "04-region-security");

    // "Why?" returns the plan's own reasoning in template mode.
    await page.getByRole("button", { name: /explain it for me/ }).click();
    await expect(page.getByText("From your plan")).toBeVisible();

    // Fill the buffer via the metric form → step done → region complete → bridge unlocks.
    await page.getByLabel("Update amount").fill("3000");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Bridge unlocked");
    await expect(page.getByRole("status")).toContainText("Savings Garden");
    await shot(page, "05-bridge-unlocked");

    // Back on the map the next step has moved to Growth.
    await page.goto("/map");
    await expect(page.getByText("Set a monthly saving target")).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, "06-map-after-unlock");

    expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("onboarding with Sarah's numbers builds a map", async ({ page }) => {
    await page.goto("/onboarding/freedom");
    await page.getByPlaceholder("For me, freedom means…").fill("I want to be able to travel without worrying about money.");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page).toHaveURL(/\/onboarding\/situation$/);
    await shot(page, "07-onboarding-situation");

    // Step 1 — about you
    await page.getByLabel("Your age").fill("21");
    await page.getByRole("radio", { name: "🎓 Student" }).click();
    await page.getByRole("button", { name: /Continue/ }).click();
    // Step 2 — money
    await page.getByLabel("Monthly income").fill("1800");
    await page.getByLabel("Monthly expenses").fill("1500");
    await page.getByLabel("Savings").fill("800");
    await page.getByLabel("Debt").fill("0");
    await page.getByRole("button", { name: /Continue/ }).click();
    // Step 3 — goals
    await page.getByLabel("What is it?").fill("Trip to Japan");
    await page.getByLabel("Target amount").fill("6000");
    await page.getByLabel("By when").fill("2028-03-01");
    await page.getByRole("button", { name: /Continue/ }).click();
    // Step 4 — how you think
    await page.getByRole("radio", { name: /^Beginner/ }).click();
    await page.getByRole("radio", { name: /^Moderate/ }).click();
    await shot(page, "08-onboarding-final");
    await page.getByRole("button", { name: /Create my Freedom Profile/ }).click();

    await expect(page).toHaveURL(/\/map$/, { timeout: 60_000 });
    await expect(page.getByRole("img", { name: /Your Freedom Map/ })).toBeVisible();
    await expect(page.getByText("Understand where your money goes")).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, "09-map-from-onboarding");
  });

  test("lesson personalisation streams and allocation keeps the total", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "See Sarah's journey" }).click();
    await expect(page).toHaveURL(/\/map$/);

    await page.goto("/lessons/emergency-fund");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("emergency buffer");
    await page.getByRole("button", { name: "Personalise for me" }).click();
    await expect(page.getByText("Reading as:")).toBeVisible();
    await expect(page.getByRole("button", { name: /Personalise again/ })).toBeVisible({ timeout: 30_000 });
    await shot(page, "10-lesson-personalised");

    await page.goto("/allocate");
    await page.getByLabel(/Amount/).fill("1000");
    await page.getByRole("button", { name: "Suggest a split" }).click();
    await expect(page.getByText(/\$1,000 across/)).toBeVisible();
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
