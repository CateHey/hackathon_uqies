import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against the real app. Reuses a running dev server on :3000
 * (start one with `pnpm dev`), boots its own, or — with E2E_BASE_URL set — runs against a
 * deployment (`E2E_BASE_URL=https://… pnpm e2e`). Mode-independent; costs cents in AI mode.
 */
const baseURL = process.env.E2E_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    colorScheme: "dark",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
