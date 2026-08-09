import { mkdir, writeFile } from "node:fs/promises";
import { resolve4, resolveCname, resolveNs } from "node:dns/promises";
import { cloudflare, digest, paginate, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const accountId = String(args["account-id"] ?? "");
const zoneName = String(args.zone ?? "arcaniumdigital.com");
const output = String(args.output ?? "ops/cloudflare/current-inventory.json");
if (!/^[0-9a-f]{32}$/.test(accountId)) throw new Error("A canonical --account-id is required");

const zones = await paginate(`/zones?account.id=${accountId}&name=${encodeURIComponent(zoneName)}`);
if (zones.length > 1) throw new Error(`Expected at most one active ${zoneName} zone; found ${zones.length}`);
if (zones.length === 0 && args["allow-external-zone"] !== true) throw new Error(`No Cloudflare zone found for ${zoneName}; pass --allow-external-zone only after verifying authoritative DNS is external`);
const zoneId = zones[0]?.id ?? null;

const requests = {
  workerScripts: `/accounts/${accountId}/workers/scripts`,
  d1Databases: `/accounts/${accountId}/d1/database`,
  queues: `/accounts/${accountId}/queues`,
  kvNamespaces: `/accounts/${accountId}/storage/kv/namespaces`,
  turnstileWidgets: `/accounts/${accountId}/challenges/widgets`,
  accessApplications: `/accounts/${accountId}/access/apps`,
  accountRulesets: `/accounts/${accountId}/rulesets`,
  workflows: `/accounts/${accountId}/workflows`,
};
if (zoneId) Object.assign(requests, {
  workerRoutes: `/zones/${zoneId}/workers/routes`,
  dnsRecords: `/zones/${zoneId}/dns_records`,
  zoneRulesets: `/zones/${zoneId}/rulesets`,
});
const safeResolve = async (resolver, name) => resolver(name).catch(() => []);
const externalDnsEvidence = zoneId ? null : {
  authoritativeNameservers: await safeResolve(resolveNs, zoneName),
  apexIpv4: await safeResolve(resolve4, zoneName),
  wwwCname: await safeResolve(resolveCname, `www.${zoneName}`),
};
const inventory = { schemaVersion: "1", accountId, zone: { id: zoneId, name: zoneName, management: zoneId ? "cloudflare" : "external", externalDnsEvidence }, capturedAt: new Date().toISOString(), notes: [], resources: {} };
for (const [key, path] of Object.entries(requests)) {
  try { inventory.resources[key] = await paginate(path); }
  catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (key === "accessApplications" && message.includes("Access is not enabled")) {
      inventory.resources[key] = [];
      inventory.notes.push("Cloudflare Access is not enabled for this account; there are no Access applications to preserve or reset.");
    } else inventory.resources[key] = { inventoryError: message };
  }
}
try { inventory.resources.pagesProjects = (await cloudflare(`/accounts/${accountId}/pages/projects`)).result ?? []; }
catch (error) { inventory.resources.pagesProjects = { inventoryError: error instanceof Error ? error.message : "UNKNOWN" }; }
const workerScripts = Array.isArray(inventory.resources.workerScripts) ? inventory.resources.workerScripts : [];
const safeBinding = (binding) => {
  const safe = { name: binding.name, type: binding.type };
  for (const key of ["id", "database_id", "namespace_id", "queue_name", "workflow_name", "service", "environment"]) {
    if (typeof binding[key] === "string") safe[key] = binding[key];
  }
  if (binding.type === "plain_text" && typeof binding.text === "string") {
    safe.valueDigest = digest(binding.text);
    try {
      const url = new URL(binding.text);
      safe.urlHostname = url.hostname;
      safe.pathRedacted = true;
    } catch {}
  }
  return safe;
};
inventory.resources.workerConfigurations = await Promise.all(workerScripts.map(async (worker) => {
  const scriptName = worker.id ?? worker.name;
  const configuration = { scriptName, bindings: [], schedules: [], notes: [] };
  try {
    const settings = await cloudflare(`/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/settings`);
    configuration.bindings = (settings.result?.bindings ?? []).map(safeBinding);
    for (const key of ["compatibility_date", "compatibility_flags", "usage_model", "tail_consumers"]) {
      if (settings.result?.[key] !== undefined) configuration[key] = settings.result[key];
    }
  } catch (error) {
    configuration.notes.push(`Settings inventory failed: ${error instanceof Error ? error.message : "UNKNOWN"}`);
  }
  try {
    const schedules = await cloudflare(`/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/schedules`);
    configuration.schedules = (schedules.result?.schedules ?? []).map((item) => ({ cron: item.cron, created_on: item.created_on, modified_on: item.modified_on }));
  } catch (error) {
    configuration.notes.push(`Schedule inventory failed: ${error instanceof Error ? error.message : "UNKNOWN"}`);
  }
  return configuration;
}));
inventory.notes.push("Worker plain-text binding values are never stored; only SHA-256 digests and URL hostnames are retained.");
inventory.notes.push("R2 is not enabled. Hyperdrive and Vectorize had no resources. Dispatch and Pipelines were unavailable for this account during authenticated capability checks.");
inventory.inventoryDigest = digest({ ...inventory, inventoryDigest: undefined });
await mkdir(new URL("../../ops/cloudflare/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ok: true, output, accountId, zoneId, zoneManagement: inventory.zone.management, inventoryDigest: inventory.inventoryDigest }));
