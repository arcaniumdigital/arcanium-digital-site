import { createHmac, randomUUID } from "node:crypto";

const baseUrl = process.env.FUNNEL_INTERNAL_API_URL;
const secret = process.env.FUNNEL_INTERNAL_HMAC_SECRET;
if (!baseUrl || !secret) {
  throw new Error("Set FUNNEL_INTERNAL_API_URL and FUNNEL_INTERNAL_HMAC_SECRET in the operator environment");
}
const url = new URL("/internal/operator-report", baseUrl);
const timestamp = new Date().toISOString();
const nonce = randomUUID();
const signature = createHmac("sha256", secret).update(`${timestamp}.${nonce}.GET.${url.pathname}.`).digest("hex");
const response = await fetch(url, {
  headers: {
    "x-arcanium-timestamp": timestamp,
    "x-arcanium-nonce": nonce,
    "x-arcanium-signature": signature,
  },
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok) throw new Error(`Operator report failed with HTTP ${response.status}`);
console.log(JSON.stringify(await response.json(), null, 2));
