import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";

const env: Env = {
  ENVIRONMENT: "test",
  TEST_CLIENT_IDS: "TEST-0001",
  TECHNICAL_HMAC_SECRET: "test-secret",
  MAX_GROUPED_ACTIONS: "20",
  ALLOW_PRODUCTION_ROLLBACK: "false",
  TECHNICAL_DB: { prepare: () => { throw new Error("Database must not be used by these boundary tests"); } },
};

describe("technical-control Worker boundary", () => {
  it("reports a TEST-only, rollback-disabled health state", async () => {
    const body = await (await handleRequest(new Request("https://technical.test/health"), env)).json() as { data: { environment: string; production_rollback_enabled: boolean } };
    expect(body.data).toEqual(expect.objectContaining({ environment: "test", production_rollback_enabled: false }));
  });
  it("rejects unsigned event batches before touching persistence", async () => {
    expect((await handleRequest(new Request("https://technical.test/v1/events", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), env)).status).toBe(401);
});
});
