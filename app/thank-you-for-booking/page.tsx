import type { Metadata } from "next";
import { BookingThankYou } from "@/components/landing/booking-thank-you";

export const metadata: Metadata = {
  title: "Your Personalised Strategy Review Is Booked",
  description: "Your personalised strategy review with Arcanium Digital is confirmed.",
  robots: { index: false, follow: false },
};

export default function ThankYouForBookingPage() {
  return <BookingThankYou />;
}
