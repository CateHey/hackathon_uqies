import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("e2e/screenshots", { recursive: true });

test("phone: the map lays out vertically and the toggle still works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "See Vinuy's journey" }).click();
  await expect(page).toHaveURL(/\/map$/);
  const map = page.getByRole("img", { name: /Your Freedom Map/ });
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  expect(box && box.height > box.width).toBe(true);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "e2e/screenshots/m1-map-phone.png", fullPage: true });

  await page.getByRole("radio", { name: /Professional/ }).click();
  await expect(page.getByText("Current position")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/m2-professional-phone.png", fullPage: true });
});
