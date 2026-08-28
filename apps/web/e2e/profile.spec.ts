import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("e2e/screenshots", { recursive: true });

/**
 * The failure this covers: the numbers entered at the start used to be write-only, and saving
 * a correction wiped the map. Editing must now be possible, visible immediately, and non-destructive.
 */
test("a demo person's numbers can be seen, edited, and the map survives", async ({ page }) => {
  await page.goto("/");
  expect((await page.request.post("/api/demo/camille")).ok()).toBe(true);

  await page.goto("/map");
  const regionsBefore = ((await (await page.request.get("/api/plan")).json()) as { plan: { regions: unknown[] } }).plan
    .regions.length;

  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Change anything");

  // What she entered is actually there.
  await expect(page.getByLabel("Monthly income")).toHaveValue("4800");
  await expect(page.getByLabel("Savings")).toHaveValue("9000");
  await expect(page.getByLabel("What is it?")).toHaveValue("Master's degree");
  await expect(page.getByLabel("Target amount")).toHaveValue("60000");
  await page.screenshot({ path: "e2e/screenshots/30-profile.png", fullPage: true });

  // Editing updates the figures live, before saving.
  await page.getByLabel("Monthly income").fill("6000");
  await expect(page.getByText("$2,600")).toBeVisible();

  await page.getByRole("button", { name: "Save my numbers" }).click();
  await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "e2e/screenshots/31-profile-saved.png", fullPage: true });

  // The plan is still there, and the map offers to rebuild rather than silently lying.
  const after = (await (await page.request.get("/api/plan")).json()) as {
    plan: { regions: unknown[] };
    profile: { monthlyIncome: number };
    metrics: { surplus: number };
  };
  expect(after.plan.regions.length).toBe(regionsBefore);
  expect(after.profile.monthlyIncome).toBe(6000);
  expect(after.metrics.surplus).toBe(2600);

  await page.goto("/map");
  await expect(page.getByText("Your numbers changed")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/32-map-stale.png", fullPage: true });

  await page.getByRole("button", { name: "Update my map" }).click();
  await expect(page.getByText("Your numbers changed")).toBeHidden({ timeout: 60_000 });
  await page.screenshot({ path: "e2e/screenshots/33-map-rebuilt.png", fullPage: true });
});

test("goals can be added and removed", async ({ page }) => {
  await page.goto("/");
  expect((await page.request.post("/api/demo/aman")).ok()).toBe(true);
  await page.goto("/profile");

  await page.getByRole("button", { name: "+ Add a goal" }).click();
  await page.getByLabel("What is it?").nth(1).fill("A decent laptop");
  await page.getByLabel("Target amount").nth(1).fill("2200");
  await page.getByRole("button", { name: "Save my numbers" }).click();
  await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 15_000 });

  const profile = (await (await page.request.get("/api/profile")).json()) as {
    profile: { goals: { label: string }[] };
  };
  expect(profile.profile.goals.map((g) => g.label)).toContain("A decent laptop");

  await page.getByRole("button", { name: "Remove" }).first().click();
  await page.getByRole("button", { name: "Save my numbers" }).click();
  await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 15_000 });
  const afterRemoval = (await (await page.request.get("/api/profile")).json()) as {
    profile: { goals: unknown[] };
  };
  expect(afterRemoval.profile.goals).toHaveLength(1);
});
