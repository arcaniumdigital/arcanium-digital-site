import "server-only";
import { createHmac, randomUUID } from "node:crypto";

export async function callFunnelInternal(
  pathname: "/internal/due-message" | "/internal/inngest-heartbeat",
  payload: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = process.env.FUNNEL_INTERNAL_API_URL;
  const secret = process.env.FUNNEL_INTERNAL_HMAC_SECRET;
  if (!baseUrl || !secret) throw new Error("FUNNEL_INTERNAL_CONFIGURATION_MISSING");

  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.POST.${pathname}.${body}`)
    .digest("hex");
  const response = await fetch(new URL(pathname, baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-arcanium-timestamp": timestamp,
      "x-arcanium-nonce": nonce,
      "x-arcanium-signature": `sha256=${signature}`,
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`FUNNEL_INTERNAL_HTTP_${response.status}`);
  return result;
}
