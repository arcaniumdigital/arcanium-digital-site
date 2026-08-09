export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function allowedOrigins(env: Cloudflare.Env): Set<string> {
  return new Set(env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean));
}

export function corsHeaders(request: Request, env: Cloudflare.Env): Headers {
  const headers = new Headers({ Vary: "Origin" });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  }
  return headers;
}

export function routeNotFound(): Response {
  return json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function readBoundedBody(request: Request, maximumBytes = 16_384): Promise<string | null> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > maximumBytes) return null;
  const body = await request.text();
  return new TextEncoder().encode(body).byteLength <= maximumBytes ? body : null;
}
