import { cookies } from "next/headers";
import { bookingTokenCookieName } from "@/lib/booking-tracking";
import { requestBookingService } from "@/lib/funnel-context";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const handle = cookieStore.get(bookingTokenCookieName)?.value;
  if (!handle) return Response.json({ error: "BOOKING_SESSION_REQUIRED" }, { status: 401 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await requestBookingService(
    `${bookingTokenCookieName}=${handle}`,
    "/internal/ghl-book-appointment",
    { method: "POST", body: input },
  ) as { ok: boolean; status: number; data: unknown } | null;

  if (!result) return Response.json({ error: "BOOKING_SERVICE_UNAVAILABLE" }, { status: 503 });
  return Response.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
