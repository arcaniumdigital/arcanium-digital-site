import { cookies } from "next/headers";
import { bookingTokenCookieName } from "@/lib/booking-tracking";
import { requestBookingService } from "@/lib/funnel-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const handle = cookieStore.get(bookingTokenCookieName)?.value;
  if (!handle) return Response.json({ error: "BOOKING_SESSION_REQUIRED" }, { status: 401 });

  const timezone = new URL(request.url).searchParams.get("timezone") ?? "Australia/Brisbane";
  const result = await requestBookingService(
    `${bookingTokenCookieName}=${handle}`,
    `/internal/ghl-free-slots?timezone=${encodeURIComponent(timezone)}`,
  ) as { ok: boolean; status: number; data: unknown } | null;

  if (!result) return Response.json({ error: "BOOKING_SERVICE_UNAVAILABLE" }, { status: 503 });
  return Response.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
