import { readFile, writeFile } from "node:fs/promises";
import { bytesDigest, cloudflare, digest, parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const plan = await readJson(String(args.plan ?? "ops/cloudflare/reset-plan.json"));
const protectedResources = await readJson(String(args.protected ?? "ops/cloudflare/protected-resources.json"));
const receipt = await readJson(String(args["backup-receipt"] ?? ""));
if (args["plan-digest"] !== plan.planDigest) throw new Error("Plan digest mismatch");
if (args["confirm-account"] !== plan.accountId || args["confirm-zone"] !== plan.zoneGuard) throw new Error("Account or zone confirmation mismatch");
if (args["confirm-scope"] !== "DELETE_LEGACY_ARCANIUM_FUNNEL_ONLY") throw new Error("Exact destructive scope confirmation is missing");
if (receipt.planDigest !== plan.planDigest || receipt.accountId !== plan.accountId) throw new Error("Backup receipt does not match this plan");
const { receiptDigest, ...receiptBody } = receipt;
if (receiptDigest !== digest(receiptBody)) throw new Error("Backup receipt digest is invalid");
if (plan.blockedInventorySections.length) throw new Error("Reset plan has incomplete inventory sections and cannot be applied");
if (digest(protectedResources) !== plan.protectedResourceDigest) throw new Error("Protected-resource manifest changed after the reset plan was created");
const inventoryBackup = receipt.backedUp.find((item) => item.kind === "inventorySnapshot" && item.id === plan.inventoryDigest);
if (!inventoryBackup?.path || !inventoryBackup.sha256 || bytesDigest(await readFile(inventoryBackup.path)) !== inventoryBackup.sha256) throw new Error("Redacted inventory backup is missing or invalid");
const resetInventory = await readJson(inventoryBackup.path);
for (const target of plan.deletions.filter((item) => ["workerScript", "d1Database", "kvNamespace"].includes(item.kind))) {
  const backup = receipt.backedUp.find((item) => item.kind === target.kind && item.id === target.id);
  if (!backup) throw new Error(`No matching backup receipt entry for ${target.kind}:${target.name}`);
  if (target.kind === "d1Database") {
    if (!backup.rowExportPath || !backup.rowExportSha256 || bytesDigest(await readFile(backup.rowExportPath)) !== backup.rowExportSha256) throw new Error(`No valid row-level D1 export recorded for ${target.name}`);
  } else if (!backup.path || !backup.sha256 || bytesDigest(await readFile(backup.path)) !== backup.sha256) {
    throw new Error(`Backup artifact is missing or invalid for ${target.name}`);
  }
}
const protectedIds = new Set(protectedResources.resourceIds ?? []);
const protectedNames = new Set(protectedResources.resourceNames ?? []);
const order = ["workerKillSwitch", "workerSchedules", "queueConsumer", "workerRoute", "workerScript", "pagesProject", "queue", "d1Database", "kvNamespace", "workflow", "turnstileWidget", "accessApplication"];
const workerTargets = plan.deletions.filter((item) => item.kind === "workerScript");
const workerNames = new Set(workerTargets.map((item) => item.id));
const edges = new Map([...workerNames].map((name) => [name, new Set()]));
const incoming = new Map([...workerNames].map((name) => [name, 0]));
for (const configuration of resetInventory.resources?.workerConfigurations ?? []) {
  if (!workerNames.has(configuration.scriptName)) continue;
  for (const binding of configuration.bindings ?? []) {
    if (!workerNames.has(binding.service) || edges.get(configuration.scriptName).has(binding.service)) continue;
    edges.get(configuration.scriptName).add(binding.service);
    incoming.set(binding.service, incoming.get(binding.service) + 1);
  }
}
const ready = [...workerNames].filter((name) => incoming.get(name) === 0).sort();
const workerDeleteOrder = [];
while (ready.length) {
  const name = ready.shift();
  workerDeleteOrder.push(name);
  for (const dependency of edges.get(name) ?? []) {
    incoming.set(dependency, incoming.get(dependency) - 1);
    if (incoming.get(dependency) === 0) ready.push(dependency);
  }
  ready.sort();
}
for (const name of [...workerNames].sort()) if (!workerDeleteOrder.includes(name)) workerDeleteOrder.push(name);
const itemsForKind = (kind) => kind === "workerScript"
  ? workerDeleteOrder.map((name) => workerTargets.find((item) => item.id === name))
  : plan.deletions.filter((candidate) => candidate.kind === kind);
const endpoints = {
  workerKillSwitch: (item) => `/accounts/${plan.accountId}/workers/scripts/${encodeURIComponent(item.scriptName)}/secrets-bulk`,
  workerSchedules: (item) => `/accounts/${plan.accountId}/workers/scripts/${encodeURIComponent(item.scriptName)}/schedules`,
  queueConsumer: (item) => `/accounts/${plan.accountId}/queues/${item.queueId}/consumers/${item.id}`,
  workerRoute: (item) => `/zones/${plan.zoneId}/workers/routes/${item.id}`,
  accessApplication: (item) => `/accounts/${plan.accountId}/access/apps/${item.id}`,
  workerScript: (item) => `/accounts/${plan.accountId}/workers/scripts/${encodeURIComponent(item.id)}`,
  queue: (item) => `/accounts/${plan.accountId}/queues/${item.id}`,
  d1Database: (item) => `/accounts/${plan.accountId}/d1/database/${item.id}`,
  kvNamespace: (item) => `/accounts/${plan.accountId}/storage/kv/namespaces/${item.id}`,
  pagesProject: (item) => `/accounts/${plan.accountId}/pages/projects/${encodeURIComponent(item.id)}`,
  turnstileWidget: (item) => `/accounts/${plan.accountId}/challenges/widgets/${item.id}`,
  workflow: (item) => `/accounts/${plan.accountId}/workflows/${encodeURIComponent(item.id)}`,
};
const killSwitchSecrets = Object.fromEntries([
  "ALLOW_PRODUCTION_SMS", "ALLOW_PREBOOK_NURTURE", "ALLOW_BOOKING_REMINDERS", "CLICKSEND_SMS_ENABLED",
].map((name) => [name, { name, text: "false", type: "secret_text" }]));
const operation = (kind) => {
  if (kind === "workerKillSwitch") return { method: "PATCH", body: JSON.stringify({ secrets: killSwitchSecrets }) };
  if (kind === "workerSchedules") return { method: "PUT", body: JSON.stringify([]) };
  return { method: "DELETE" };
};
const targets = order.flatMap((kind) => itemsForKind(kind).map((item) => ({ kind, id: item.id, name: item.name, endpoint: endpoints[kind](item), method: operation(kind).method })));
if (args["dry-run"] === true) {
  const dryRunBody = { schemaVersion: "1", accountId: plan.accountId, zoneId: plan.zoneId, zoneGuard: plan.zoneGuard, planDigest: plan.planDigest, createdAt: new Date().toISOString(), targets };
  const dryRunReceipt = { ...dryRunBody, receiptDigest: digest(dryRunBody) };
  const output = String(args["dry-run-output"] ?? "ops/cloudflare/reset-dry-run-receipt.json");
  await writeFile(output, `${JSON.stringify(dryRunReceipt, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, dryRun: true, output, targetCount: targets.length, receiptDigest: dryRunReceipt.receiptDigest }));
  process.exit(0);
}
const dryRunReceipt = await readJson(String(args["dry-run-receipt"] ?? ""));
const { receiptDigest: dryRunDigest, ...dryRunBody } = dryRunReceipt;
if (dryRunDigest !== digest(dryRunBody) || dryRunReceipt.planDigest !== plan.planDigest || dryRunReceipt.accountId !== plan.accountId || dryRunReceipt.zoneGuard !== plan.zoneGuard) {
  throw new Error("A valid dry-run receipt for this exact reset plan is required");
}
for (const kind of order) {
  for (const item of itemsForKind(kind)) {
    if (protectedIds.has(item.id) || protectedNames.has(item.name)) throw new Error(`Protected resource entered deletion plan: ${item.kind}:${item.name}`);
    try {
      await cloudflare(endpoints[kind](item), operation(kind));
      console.log(JSON.stringify({ applied: true, kind: item.kind, id: item.id, name: item.name }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (/Cloudflare API 404/.test(message)) console.log(JSON.stringify({ alreadyAbsent: true, kind: item.kind, id: item.id, name: item.name }));
      else throw error;
    }
  }
}
console.log(JSON.stringify({ ok: true, planDigest: plan.planDigest, deletedCount: plan.deletions.length }));
