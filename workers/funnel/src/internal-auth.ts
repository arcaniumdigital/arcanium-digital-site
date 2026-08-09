import { constantTimeEqual, hmacHex, opaqueId, sha256Hex } from "./crypto";

export async function signInternalRequest(secret: string, input: {
  timestamp: string;
  nonce: string;
  method: string;
  pathname: string;
  body: string;
}): Promise<string> {
  return hmacHex(secret, `${input.timestamp}.${input.nonce}.${input.method}.${input.pathname}.${input.body}`);
}

export async function verifyInternalRequest(request: Request, env: Cloudflare.Env, rawBody: string): Promise<boolean> {
  const timestamp = request.headers.get("x-arcanium-timestamp") ?? "";
  const nonce = request.headers.get("x-arcanium-nonce") ?? "";
  const signature = request.headers.get("x-arcanium-signature")?.replace(/^sha256=/i, "") ?? "";
  const timestampMs = Date.parse(timestamp);
  if (!timestamp || !/^[0-9a-f-]{36}$/i.test(nonce) || !signature || !Number.isFinite(timestampMs)) return false;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;
  const pathname = new URL(request.url).pathname;
  const expected = await signInternalRequest(env.INTERNAL_API_HMAC_SECRET, {
    timestamp,
    nonce,
    method: request.method,
    pathname,
    body: rawBody,
  });
  if (!constantTimeEqual(expected, signature)) return false;
  try {
    await env.DB.prepare(
      "INSERT INTO webhook_events (id, provider, provider_event_key, event_type, payload_hash, received_at, processing_status) VALUES (?, 'internal', ?, 'AUTH_NONCE', ?, ?, 'PROCESSED')",
    ).bind(opaqueId("webhook"), nonce, await sha256Hex(rawBody), new Date().toISOString()).run();
    return true;
  } catch {
    return false;
  }
}
