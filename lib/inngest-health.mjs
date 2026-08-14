export const INNGEST_DEPLOYMENT_PROBE_VERSION = 1;

export function isInngestDeploymentProbe(request) {
  return new URL(request.url).searchParams.get("probe") === "deployment";
}

export function createInngestDeploymentProbeResponse(functionCount) {
  return Response.json(
    {
      ok: true,
      service: "arcanium-vendor-audit-inngest",
      probeVersion: INNGEST_DEPLOYMENT_PROBE_VERSION,
      functionCount,
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}

export function inngestDeploymentProbeUrl(baseUrl) {
  const url = new URL("/api/inngest", baseUrl);
  url.searchParams.set("probe", "deployment");
  return url;
}

export async function verifyInngestDeployment(baseUrl, fetchImplementation = fetch) {
  const url = inngestDeploymentProbeUrl(baseUrl);
  const response = await fetchImplementation(url, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Inngest deployment probe returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (
    payload?.ok !== true ||
    payload?.service !== "arcanium-vendor-audit-inngest" ||
    payload?.probeVersion !== INNGEST_DEPLOYMENT_PROBE_VERSION ||
    !Number.isInteger(payload?.functionCount) ||
    payload.functionCount < 1
  ) {
    throw new Error("Inngest deployment probe returned an invalid contract");
  }

  return payload;
}
