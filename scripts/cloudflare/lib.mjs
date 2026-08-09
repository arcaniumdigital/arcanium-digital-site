import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    result[key] = next && !next.startsWith("--") ? (index += 1, next) : true;
  }
  return result;
}

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function bytesDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function cloudflare(path, init = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN must be supplied through the environment; never paste it into the command or repository");
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const detail = result?.errors?.[0]?.message ? `: ${result.errors[0].message}` : "";
    throw new Error(`Cloudflare API ${response.status} failed for ${path}${detail}`);
  }
  return result;
}

export async function paginate(path) {
  const items = [];
  for (let page = 1; page <= 100; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await cloudflare(`${path}${separator}page=${page}&per_page=25`);
    items.push(...(Array.isArray(response.result) ? response.result : []));
    if (!response.result_info || page >= Number(response.result_info.total_pages ?? 1)) break;
  }
  return items;
}
