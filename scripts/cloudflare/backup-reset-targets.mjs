import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { bytesDigest, cloudflare, digest, parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN must be supplied through the operator environment");
const plan = await readJson(String(args.plan ?? "ops/cloudflare/reset-plan.json"));
const inventory = await readJson(String(args.inventory ?? "ops/cloudflare/current-inventory.json"));
if (String(args["plan-digest"] ?? "") !== plan.planDigest) throw new Error("The supplied plan digest does not match the reviewed reset plan");
if (inventory.inventoryDigest !== plan.inventoryDigest || inventory.accountId !== plan.accountId) throw new Error("Inventory snapshot does not match this reset plan");
const directory = String(args.output ?? `ops/cloudflare/backups/${new Date().toISOString().replaceAll(":", "-")}`);
const d1ExportDirectory = String(args["d1-export-dir"] ?? "");
await mkdir(directory, { recursive: true, mode: 0o700 });
const backedUp = [];
const inventoryPath = `${directory}/redacted-cloudflare-inventory.json`;
await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
backedUp.push({ kind: "inventorySnapshot", id: inventory.inventoryDigest, name: "redacted Cloudflare configuration inventory", path: inventoryPath, sha256: bytesDigest(await readFile(inventoryPath)) });
for (const target of plan.deletions) {
  if (target.kind !== "workerScript") continue;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${plan.accountId}/workers/scripts/${encodeURIComponent(target.id)}`, { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } });
  if (!response.ok) throw new Error(`Could not back up Worker ${target.name}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const path = `${directory}/worker-${target.name}.bin`;
  await writeFile(path, bytes, { mode: 0o600 });
  backedUp.push({ kind: target.kind, id: target.id, name: target.name, path, sha256: bytesDigest(bytes) });
}
const authorizedFetch = async (path) => fetch(`https://api.cloudflare.com/client/v4${path}`, {
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  signal: AbortSignal.timeout(30_000),
});
for (const target of plan.deletions) {
  if (target.kind !== "kvNamespace") continue;
  const kvDirectory = `${directory}/kv-${target.name}`;
  await mkdir(kvDirectory, { recursive: true, mode: 0o700 });
  const keys = [];
  let cursor = "";
  for (let page = 0; page < 10_000; page += 1) {
    const suffix = cursor ? `?limit=1000&cursor=${encodeURIComponent(cursor)}` : "?limit=1000";
    const response = await authorizedFetch(`/accounts/${plan.accountId}/storage/kv/namespaces/${target.id}/keys${suffix}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success || !Array.isArray(payload.result)) throw new Error(`Could not list KV keys for ${target.name}`);
    keys.push(...payload.result);
    const next = payload.result_info?.cursor ?? "";
    if (!next || next === cursor) break;
    cursor = next;
  }
  const index = [];
  for (const key of keys) {
    const response = await authorizedFetch(`/accounts/${plan.accountId}/storage/kv/namespaces/${target.id}/values/${encodeURIComponent(key.name)}`);
    if (!response.ok) throw new Error(`Could not export a KV value from ${target.name}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const keyDigest = digest(key.name);
    const path = `${kvDirectory}/${keyDigest}.bin`;
    await writeFile(path, bytes, { mode: 0o600 });
    index.push({ key: key.name, expiration: key.expiration ?? null, metadata: key.metadata ?? null, path, sha256: bytesDigest(bytes) });
  }
  const indexPath = `${kvDirectory}/index.json`;
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, { mode: 0o600 });
  backedUp.push({ kind: target.kind, id: target.id, name: target.name, path: indexPath, sha256: bytesDigest(await readFile(indexPath)), keyCount: index.length });
}
for (const target of plan.deletions) {
  if (target.kind !== "d1Database") continue;
  if (!d1ExportDirectory) throw new Error("--d1-export-dir is required when the reset plan contains D1 databases");
  const rowExportPath = `${d1ExportDirectory}/${target.name}.sql`;
  const rowExportStat = await stat(rowExportPath).catch(() => null);
  if (!rowExportStat?.isFile() || rowExportStat.size < 1) throw new Error(`Missing non-empty D1 row export: ${rowExportPath}`);
  const rowExportBytes = await readFile(rowExportPath);
  const metadata = await cloudflare(`/accounts/${plan.accountId}/d1/database/${target.id}`);
  const path = `${directory}/d1-${target.name}-metadata.json`;
  await writeFile(path, `${JSON.stringify(metadata.result, null, 2)}\n`, { mode: 0o600 });
  backedUp.push({ kind: target.kind, id: target.id, name: target.name, path, rowExportPath, rowExportSha256: bytesDigest(rowExportBytes) });
}
const receiptBody = { schemaVersion: "1", accountId: plan.accountId, planDigest: plan.planDigest, createdAt: new Date().toISOString(), backedUp };
const receipt = { ...receiptBody, receiptDigest: digest(receiptBody) };
await writeFile(`${directory}/backup-receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ok: true, directory, receipt: `${directory}/backup-receipt.json`, receiptDigest: receipt.receiptDigest }));
