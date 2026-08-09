import { constantTimeEqual, hmacHex } from "./crypto";

export async function verifiedProxyClientIp(request: Request, env: Cloudflare.Env, rawBody: string): Promise<string | null> {
  const timestamp = request.headers.get("x-arcanium-proxy-timestamp") ?? "";
  const clientIp = request.headers.get("x-arcanium-client-ip") ?? "";
  const signature = request.headers.get("x-arcanium-proxy-signature") ?? "";
  const timestampMs = Date.parse(timestamp);
  if (!timestamp || !clientIp || !signature || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) return null;
  const expected = await hmacHex(env.INTERNAL_API_HMAC_SECRET, `${timestamp}.${clientIp}.${rawBody}`);
  return constantTimeEqual(expected, signature) ? clientIp : null;
}
