import "server-only";
import { createHmac } from "node:crypto";

export async function proxyToFunnel(request: Request, pathname: string): Promise<Response> {
  const baseUrl = process.env.FUNNEL_INTERNAL_API_URL;
  const secret = process.env.FUNNEL_INTERNAL_HMAC_SECRET;
  if (!baseUrl || !secret) {
    return Response.json({ accepted: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16_384) {
    return Response.json({ accepted: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  const clientIp = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
  const timestamp = new Date().toISOString();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${clientIp}.${raw}`).digest("hex");

  try {
    const upstream = await fetch(new URL(pathname, baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
        Origin: request.headers.get("Origin") ?? new URL(request.url).origin,
        "User-Agent": request.headers.get("User-Agent") ?? "arcanium-vercel-proxy",
        "x-arcanium-proxy-timestamp": timestamp,
        "x-arcanium-client-ip": clientIp,
        "x-arcanium-proxy-signature": signature,
      },
      body: raw,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    const headers = new Headers({
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    });
    const cookie = upstream.headers.get("Set-Cookie");
    if (cookie) headers.set("Set-Cookie", cookie);
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers });
  } catch {
    return Response.json({ accepted: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
