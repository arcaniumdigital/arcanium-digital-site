import assert from "node:assert/strict";
import test from "node:test";

import {
  createInngestDeploymentProbeResponse,
  inngestDeploymentProbeUrl,
  isInngestDeploymentProbe,
  verifyInngestDeployment,
} from "../lib/inngest-health.mjs";

test("deployment probes are explicit and do not intercept normal Inngest requests", () => {
  assert.equal(isInngestDeploymentProbe(new Request("https://example.com/api/inngest?probe=deployment")), true);
  assert.equal(isInngestDeploymentProbe(new Request("https://example.com/api/inngest")), false);
});

test("deployment probe response is non-cacheable and exposes no secret data", async () => {
  const response = createInngestDeploymentProbeResponse(3);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "arcanium-vendor-audit-inngest",
    probeVersion: 1,
    functionCount: 3,
  });
});

test("deployment probe URL is deterministic", () => {
  assert.equal(
    inngestDeploymentProbeUrl("https://www.arcaniumdigital.com").href,
    "https://www.arcaniumdigital.com/api/inngest?probe=deployment",
  );
});

test("deployment verification rejects a route-level 404", async () => {
  await assert.rejects(
    verifyInngestDeployment("https://example.com", async () => new Response("not found", { status: 404 })),
    /HTTP 404/,
  );
});

test("deployment verification accepts only the expected health contract", async () => {
  const payload = await verifyInngestDeployment(
    "https://example.com",
    async () => createInngestDeploymentProbeResponse(3),
  );
  assert.equal(payload.functionCount, 3);

  await assert.rejects(
    verifyInngestDeployment(
      "https://example.com",
      async () => Response.json({ ok: true, service: "wrong", probeVersion: 1, functionCount: 3 }),
    ),
    /invalid contract/,
  );
});
