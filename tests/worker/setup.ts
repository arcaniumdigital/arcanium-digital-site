import { applyD1Migrations, env } from "cloudflare:test";
import { inject } from "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    FUNNEL_MIGRATIONS: D1Migration[];
  }
}

await applyD1Migrations(env.DB, inject("FUNNEL_MIGRATIONS"));
