import "server-only";
import { createHmac, randomUUID } from "node:crypto";

export type BookingContext = {
  fullName: string;
  phoneE164: string;
  email?: string;
  signedLeadCorrelation: string;
};

export async function resolveBookingContext(cookieHeader: string): Promise<BookingContext | null> {
  const result = await requestBookingService(cookieHeader, "/internal/booking-context") as { context?: BookingContext } | null;
  return result?.context ?? null;
}

export async function resolveGhlBooking(cookieHeader: string): Promise<unknown> {
  return requestBookingService(cookieHeader, "/internal/ghl-booking-confirmation");
}

export async function requestBookingService(
  cookieHeader: string,
  pathname: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<{ ok: boolean; status: number; data: unknown } | unknown> {
  const baseUrl = process.env.FUNNEL_INTERNAL_API_URL;
  const secret = process.env.FUNNEL_INTERNAL_HMAC_SECRET;
  if (!baseUrl || !secret || !cookieHeader) return null;
  const url = new URL(pathname, baseUrl);
  const method = init.method ?? "GET";
  const rawBody = init.body === undefined ? "" : JSON.stringify(init.body);
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const payload = `${timestamp}.${nonce}.${method}.${url.pathname}.${rawBody}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Cookie: cookieHeader,
        ...(rawBody ? { "Content-Type": "application/json" } : {}),
        "x-arcanium-timestamp": timestamp,
        "x-arcanium-nonce": nonce,
        "x-arcanium-signature": signature,
      },
      ...(rawBody ? { body: rawBody } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const data = await response.json().catch(() => null);
    if (pathname === "/internal/booking-context" || pathname === "/internal/ghl-booking-confirmation") {
      return response.ok ? data : null;
    }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return null;
  }
}
