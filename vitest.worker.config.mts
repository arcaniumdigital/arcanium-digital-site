import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => ({
  plugins: [cloudflareTest({
    wrangler: { configPath: "workers/funnel/wrangler.jsonc" },
    miniflare: {
      bindings: {
        TURNSTILE_SECRET_KEY: "test-secret",
        INTERNAL_API_HMAC_SECRET: "test-internal-secret",
        BOOKING_CONTEXT_HMAC_SECRET: "test-context-secret",
        CAL_WEBHOOK_SECRET: "test-cal-secret",
        FUNNEL_HEALTH_READ_TOKEN: "health-test-token-with-at-least-32-characters",
      },
    },
  })],
  test: {
    include: ["tests/worker/**/*.test.ts"],
    setupFiles: ["tests/worker/setup.ts"],
    provide: { FUNNEL_MIGRATIONS: await readD1Migrations("workers/funnel/migrations") },
  },
}));
