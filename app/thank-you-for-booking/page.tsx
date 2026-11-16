import type { Metadata } from "next";
import { BookingThankYou } from "@/components/landing/booking-thank-you";

export const metadata: Metadata = {
  title: "Discovery Call Details",
  description: "View your discovery call details.",
  robots: { index: false, follow: false },
};

export default function ThankYouForBookingPage() {
  return <BookingThankYou />;
}
