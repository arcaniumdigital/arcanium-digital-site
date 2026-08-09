import { parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const plan = await readJson(String(args.plan ?? "ops/cloudflare/reset-plan.json"));
const inventory = await readJson(String(args.inventory ?? "ops/cloudflare/post-reset-inventory.json"));
if (inventory.accountId !== plan.accountId || inventory.zone.id !== plan.zoneId) throw new Error("Post-reset inventory account/zone mismatch");
const remaining = [];
for (const target of plan.deletions) {
  const collections = Object.values(inventory.resources).filter(Array.isArray);
  if (collections.some((items) => items.some((item) => [item.id, item.uuid, item.sitekey, item.name, item.title, item.queue_name].includes(target.id) || [item.name, item.title, item.queue_name, item.pattern].includes(target.name)))) remaining.push(target);
}
if (remaining.length) throw new Error(`Reset verification failed; ${remaining.length} planned resources remain`);
console.log(JSON.stringify({ ok: true, marker: "CLOUDFLARE_RESET_CLEAN", planDigest: plan.planDigest }));
