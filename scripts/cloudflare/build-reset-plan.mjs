import { writeFile } from "node:fs/promises";
import { digest, parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const inventoryPath = String(args.inventory ?? "ops/cloudflare/current-inventory.json");
const protectedPath = String(args.protected ?? "ops/cloudflare/protected-resources.json");
const output = String(args.output ?? "ops/cloudflare/reset-plan.json");
const inventory = await readJson(inventoryPath);
const protectedResources = await readJson(protectedPath);
if (inventory.accountId !== protectedResources.accountId || inventory.zone.id !== protectedResources.zoneId) throw new Error("Inventory and protected-resource account/zone guards do not match");

const legacyWorkers = new Set([
  "arcanium-platform-core-production", "arcanium-schedule-control-test", "arcanium-queue-control-test", "arcanium-reporting-control-test",
  "arcanium-authority-control-test", "arcanium-local-geo-control-test", "arcanium-search-growth-test", "arcanium-evidence-control-test",
  "arcanium-form-delivery-test", "arcanium-technical-control-test", "arcanium-gbp-control-test", "arcanium-publication-control-test",
  "arcanium-access-checks-test", "arcanium-listing-control-test", "arcanium-platform-core-test", "arcmcp-platform-test", "test-technical-control", "test-platform-ops",
]);
const legacyWorkflows = new Set([
  "arcanium-client-nurture-v2-production", "arcanium-nurture-sequence-production", "arcanium-nurture-sequence-test",
]);
const legacyName = (name) => /(^test-|\btest\b|platform-ops|search-reporting|local-authority|listing-content|cost-imports|cro-analysis|media-processing|migration|site-provisioning|authority-runs|form-delivery|gbp-events|geo-runs|listing-actions|platform-events|reporting-runs|search-growth|technical-results)/.test(name);
const protectedIds = new Set(protectedResources.resourceIds ?? []);
const protectedNames = new Set(protectedResources.resourceNames ?? []);
const candidates = [];
const add = (kind, id, name, reason, details = {}) => {
  if (!id || !name || protectedIds.has(id) || protectedNames.has(name)) return;
  candidates.push({ kind, id, name, reason, ...details });
};
for (const item of inventory.resources.workerScripts ?? []) {
  const scriptName = item.id ?? item.name;
  if (!legacyWorkers.has(scriptName)) continue;
  add("workerKillSwitch", scriptName, scriptName, "set the four mandatory global outbound kill switches before disabling triggers", { scriptName });
  add("workerScript", scriptName, scriptName, "legacy funnel/platform Worker");
}
for (const item of inventory.resources.workerRoutes ?? []) if (legacyWorkers.has(item.script)) add("workerRoute", item.id, item.pattern, `route owned by ${item.script}`);
for (const item of inventory.resources.workerConfigurations ?? []) {
  if (legacyWorkers.has(item.scriptName) && item.schedules?.length) {
    add("workerSchedules", item.scriptName, item.scriptName, "disable legacy Worker Cron triggers before deleting code", { scriptName: item.scriptName, schedules: item.schedules.map((schedule) => schedule.cron) });
  }
}
for (const item of inventory.resources.d1Databases ?? []) if (legacyName(item.name)) add("d1Database", item.uuid ?? item.id, item.name, "legacy funnel/platform state");
for (const item of inventory.resources.queues ?? []) {
  const queueName = item.queue_name ?? item.name;
  if (!legacyName(queueName)) continue;
  for (const consumer of item.consumers ?? []) {
    add("queueConsumer", consumer.consumer_id, `${queueName}:${consumer.script_name ?? consumer.type ?? "consumer"}`, "remove legacy Queue consumer before deleting queue", {
      queueId: item.queue_id ?? item.id,
      queueName,
      scriptName: consumer.script_name ?? null,
    });
  }
  add("queue", item.queue_id ?? item.id, queueName, "legacy funnel/platform queue");
}
for (const item of inventory.resources.kvNamespaces ?? []) if (legacyName(item.title)) add("kvNamespace", item.id, item.title, "legacy funnel/platform KV");
for (const item of inventory.resources.pagesProjects ?? []) if (item.name === "arcanium-digital-site") add("pagesProject", item.name, item.name, "obsolete Cloudflare Pages copy; Vercel remains protected");
for (const item of inventory.resources.turnstileWidgets ?? []) if (/arcanium|vendor-audit/i.test(item.name ?? "")) add("turnstileWidget", item.sitekey, item.name, "obsolete or replacement funnel widget");
for (const item of inventory.resources.accessApplications ?? []) if (/arcanium|funnel|health|admin/i.test(item.name ?? "")) add("accessApplication", item.id, item.name, "legacy funnel/admin Access application");
for (const item of inventory.resources.workflows ?? []) {
  const name = item.name ?? item.id;
  if (legacyWorkflows.has(name)) add("workflow", name, name, "legacy nurture Workflow");
}

const resourceErrors = Object.entries(inventory.resources).filter(([, value]) => !Array.isArray(value));
const planBody = {
  schemaVersion: "1",
  accountId: inventory.accountId,
  zoneId: inventory.zone.id,
  zoneGuard: inventory.zone.id ?? "EXTERNAL_DNS_NOT_CLOUDFLARE",
  zoneManagement: inventory.zone.management,
  zoneName: inventory.zone.name,
  inventoryDigest: inventory.inventoryDigest,
  createdAt: new Date().toISOString(),
  scope: "legacy Arcanium Cloudflare funnel/platform resources only; Vercel website and unrelated DNS are protected",
  blockedInventorySections: resourceErrors.map(([key, value]) => ({ key, error: value.inventoryError })),
  deletions: candidates.sort((left, right) => `${left.kind}:${left.name}`.localeCompare(`${right.kind}:${right.name}`)),
  protectedResourceDigest: digest(protectedResources),
};
const plan = { ...planBody, planDigest: digest(planBody) };
await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ok: true, output, planDigest: plan.planDigest, deletionCount: plan.deletions.length, blockedInventorySections: plan.blockedInventorySections.length }));
