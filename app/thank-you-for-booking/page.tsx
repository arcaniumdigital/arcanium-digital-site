import type { Metadata } from "next";
import { BookingThankYou } from "@/components/landing/booking-thank-you";

export const metadata: Metadata = {
  title: "Your Strategy Call Is Booked",
  description: "Your strategy call with Arcanium Digital is confirmed.",
  robots: { index: false, follow: false },
};

export default function ThankYouForBookingPage() {
  return <BookingThankYou />;
}
