import { NextResponse } from "next/server";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/vendor-lead-opportunity", request.url), 303);
  response.cookies.set("arc_booking_source", "sms", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/vendor-lead-opportunity",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
