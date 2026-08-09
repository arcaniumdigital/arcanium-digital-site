import "server-only";
import { createHmac, randomUUID } from "node:crypto";

export type BookingContext = {
  fullName: string;
  phoneE164: string;
  signedLeadCorrelation: string;
};

export async function resolveBookingContext(cookieHeader: string): Promise<BookingContext | null> {
  const baseUrl = process.env.FUNNEL_INTERNAL_API_URL;
  const secret = process.env.FUNNEL_INTERNAL_HMAC_SECRET;
  if (!baseUrl || !secret || !cookieHeader) return null;
  const url = new URL("/internal/booking-context", baseUrl);
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const payload = `${timestamp}.${nonce}.GET.${url.pathname}.`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const response = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
        "x-arcanium-timestamp": timestamp,
        "x-arcanium-nonce": nonce,
        "x-arcanium-signature": signature,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const result = await response.json() as { context?: BookingContext | null };
    return result.context ?? null;
  } catch {
    return null;
  }
}
