import { NextResponse } from "next/server";
import { bookingTokenCookieName } from "@/lib/booking-tracking";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/#audit", request.url), 303);
  response.cookies.set({
    name: bookingTokenCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/vendor-lead-opportunity",
  });
  return response;
}
