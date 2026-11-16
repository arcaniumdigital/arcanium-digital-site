import { cookies } from "next/headers";
import { bookingTokenCookieName } from "@/lib/booking-tracking";
import { resolveGhlBooking } from "@/lib/funnel-context";
export async function GET() {
  const cookieStore = await cookies();
  const handle = cookieStore.get(bookingTokenCookieName)?.value;
  const result = handle ? await resolveGhlBooking(`${bookingTokenCookieName}=${handle}`) : null;
  return Response.json(result ?? { booking: null }, { headers: { "Cache-Control": "no-store" } });
}
