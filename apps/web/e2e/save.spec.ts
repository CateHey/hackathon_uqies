import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("e2e/screenshots", { recursive: true });

/** Load a demo persona into this browser's session. */
async function loadPersona(page: Page, name: string) {
  await page.goto("/");
  const res = await page.request.post(`/api/demo/${name}`);
  expect(res.ok()).toBe(true);
}

test.describe("Pay Yourself First", () => {
  test("Vinuy: the split, the ways, and the scenario switch", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await loadPersona(page, "vinuy");
    await page.goto("/save");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("a month, before anything else");
    await expect(page.getByText("10% house deposit").first()).toBeVisible();
    await expect(page.getByText("Where it goes")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/20-save-vinuy.png", fullPage: true });

    // Changing the growth assumption recalculates server-side.
    await page.getByRole("radio", { name: "6% a year" }).click();
    await expect(page.getByRole("radio", { name: "6% a year" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Where it goes")).toBeVisible();

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("Mike: the venture goal takes no monthly slice and says why", async ({ page }) => {
    await loadPersona(page, "mike");
    await page.goto("/save");

    await expect(page.getByRole("heading", { name: "Comes from what you build" })).toBeVisible();
    await expect(page.getByText(/has to come from what you build/).first()).toBeVisible();

    // The apartment — the goal he can fund — has a real monthly line.
    const save = (await (await page.request.get("/api/save")).json()) as {
      pay: { lines: { key: string; amount: number }[]; growthGoals: { goalId: string }[] };
    };
    expect(save.pay.growthGoals.map((g) => g.goalId)).toEqual(["g-million"]);
    expect(save.pay.lines.find((l) => l.key === "g-apartment")!.amount).toBe(495);

    // Dropping the apartment moves its money out of the goal line.
    await page.getByRole("button", { name: /Deposit for an investment apartment/ }).click();
    await expect(page.getByText("Recalculating…")).toBeHidden({ timeout: 15_000 });
    await page.screenshot({ path: "e2e/screenshots/21-save-mike-scenario.png", fullPage: true });
  });

  test("Zuko: an unreachable goal shows honest routes, not a fantasy", async ({ page }) => {
    await loadPersona(page, "zuko");
    await page.goto("/save");

    await page.getByRole("button", { name: /ways to get there/ }).click();
    const body = page.locator("body");
    await expect(body).toContainText(/Earn more|Give it longer|Not by saving/);
    // Never offers "save a bigger share" for a gap saving cannot close.
    await expect(page.getByText("Save a bigger share")).toHaveCount(0);
    await page.screenshot({ path: "e2e/screenshots/22-save-zuko.png", fullPage: true });
  });
});

test.describe("Vision board", () => {
  test("shows every goal and lets you edit what's set aside", async ({ page }) => {
    await loadPersona(page, "camille");
    await page.goto("/vision");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("What you're paying yourself for");
    await expect(page.getByText("Master's degree")).toBeVisible();
    await expect(page.getByText(/in cash, not in loans/)).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/23-vision.png", fullPage: true });

    await page.getByRole("button", { name: "Edit" }).first().click();
    const input = page.getByLabel("Already set aside for this");
    await input.fill("20000");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("$20,000 of $60,000")).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: "e2e/screenshots/24-vision-edited.png", fullPage: true });
  });
});
