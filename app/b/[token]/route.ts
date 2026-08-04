import { NextResponse } from "next/server";
import {
  bookingTokenCookieName,
  normalizeBookingToken,
} from "@/lib/booking-tracking";

interface BookingRedirectContext {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, context: BookingRedirectContext) {
  const { token: rawToken } = await context.params;
  const token = normalizeBookingToken(rawToken);
  const destination = new URL("/vendor-audit", request.url);

  if (!token) {
    return NextResponse.redirect(destination, 302);
  }

  const response = NextResponse.redirect(destination, 302);

  response.cookies.set({
    name: bookingTokenCookieName,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
