import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_VENDOR_AUDIT_API_URL: "https://funnel.test/api/vendor-audit",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      NEXT_PUBLIC_CAL_EVENT_SLUG: "arcaniumdigital/vendor-conversion-audit",
    },
  },
  projects: [{ name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
