import type { Metadata } from "next";
import { BookingThankYou } from "@/components/landing/booking-thank-you";

export const metadata: Metadata = {
  title: "Your Seller Pipeline Audit Is Booked",
  description: "Your Seller Pipeline Audit with Arcanium Digital is confirmed.",
  robots: { index: false, follow: false },
};

export default function ThankYouForBookingPage() {
  return <BookingThankYou />;
}
