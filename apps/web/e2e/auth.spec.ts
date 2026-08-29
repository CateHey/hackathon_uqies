import { expect, test } from "@playwright/test";

/**
 * Sign in as a seeded demo account and land on that person's journey. Runs only when the
 * server reports Supabase Auth is configured (and `pnpm seed:demo` has been run).
 */
const EMAIL = "vinuy@demo.free-me.app";
const PASSWORD = process.env.DEMO_PASSWORD ?? "FreeMe-demo-2026";

test("demo account: sign in → own map → sign out", async ({ page }) => {
  const health = (await (await page.request.get("/api/health")).json()) as { auth: boolean; db: string };
  test.skip(!health.auth || health.db !== "supabase", "Supabase auth/db not configured");

  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/map$/, { timeout: 30_000 });
  await expect(page.getByRole("img", { name: /Your Freedom Map/ })).toBeVisible();
  const plan = (await (await page.request.get("/api/plan")).json()) as {
    profile: { freedomStatement: string };
    plan: { source: string; regions: unknown[] };
  };
  expect(plan.profile.freedomStatement).toMatch(/deposit on my first place/);
  // Whether the seeded plan is model-generated or rules-based depends on whether golden plans
  // have been generated for the current cast — an operational fact, not a correctness one.
  // What must hold is that signing in lands you on *your* plan.
  expect(["ai", "template"]).toContain(plan.plan.source);
  expect(plan.plan.regions.length).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /vinuy · Sign out/ })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/13-signed-in.png", fullPage: true });

  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
