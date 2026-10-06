"use client";

import { CalendarPlus, CheckCircle2 } from "lucide-react";
import Script from "next/script";
import { useEffect, useState } from "react";
import { bookingConfirmationStorageKey } from "@/lib/booking-tracking";

interface BookingConfirmation {
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
}

function calendarTimestamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function BookingThankYou() {
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.sessionStorage.getItem(bookingConfirmationStorageKey);
        if (stored) setBooking(JSON.parse(stored) as BookingConfirmation);
      } catch {
        // The confirmation page still works if browser storage is unavailable.
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const hasCalendarEvent = Boolean(booking?.startTime && booking?.endTime);

  function addToCalendar() {
    if (!booking?.startTime || !booking.endTime) return;

    const title = booking.title || "Seller Pipeline Audit with Arcanium Digital";
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Arcanium Digital//Seller Pipeline Audit//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${escapeCalendarText(booking.uid || crypto.randomUUID())}@arcaniumdigital.com`,
      `DTSTAMP:${calendarTimestamp(new Date().toISOString())}`,
      `DTSTART:${calendarTimestamp(booking.startTime)}`,
      `DTEND:${calendarTimestamp(booking.endTime)}`,
      `SUMMARY:${escapeCalendarText(title)}`,
      `DESCRIPTION:${escapeCalendarText("Your Seller Pipeline Audit with Arcanium Digital. Your Cal.com confirmation email contains the meeting details and rescheduling link.")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcanium-seller-pipeline-audit.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090c] px-5 py-14 text-[#f5f5f3] sm:px-7 sm:py-20 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(143,51,255,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-[1050px]">
        <div className="mx-auto max-w-[760px] text-center">
          <CheckCircle2 className="mx-auto size-12 text-[#a95cff]" aria-hidden="true" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#bca7d8]">Your audit is booked</p>
          <h1 className="mt-4 font-display text-[clamp(2.7rem,8vw,5rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
            You’re all set.
          </h1>
          <p className="mx-auto mt-6 max-w-[650px] text-base leading-relaxed text-[#aaaab2] sm:text-lg">
            Your Seller Pipeline Audit is confirmed. Check your inbox for the Cal.com confirmation and watch this short video before our call.
          </p>

          {hasCalendarEvent && (
            <button
              type="button"
              onClick={addToCalendar}
              className="mt-7 inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[#f4f4f2] px-7 text-sm font-semibold text-[#0b0c0f] transition hover:-translate-y-px hover:bg-white"
            >
              <CalendarPlus className="mr-2 size-5" aria-hidden="true" />
              Add booking to calendar
            </button>
          )}
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-[920px]">
          <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[20px] border border-[#8f33ff]/20 bg-[#15161c] sm:translate-x-4 sm:translate-y-4 sm:rounded-[24px]" />
          <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black p-1.5 shadow-[0_38px_100px_rgba(0,0,0,0.5)] sm:rounded-[24px] sm:p-2">
            <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
            <Script src="https://fast.wistia.com/embed/dorbye8aan.js" strategy="afterInteractive" type="module" />
            <style jsx global>{`
              .booking-thank-you-video wistia-player[media-id="dorbye8aan"] {
                display: block;
                width: 100%;
              }
              .booking-thank-you-video wistia-player[media-id="dorbye8aan"]:not(:defined) {
                background: center / contain no-repeat url("https://fast.wistia.com/embed/medias/dorbye8aan/swatch");
                display: block;
                filter: blur(5px);
                padding-top: 56.25%;
              }
            `}</style>
            <div
              className="booking-thank-you-video"
              dangerouslySetInnerHTML={{
                __html: '<wistia-player media-id="dorbye8aan" aspect="1.7777777777777777" player-color="#8f33ff" autoplay silent-autoplay="allow" volume="1"></wistia-player>',
              }}
            />
          </div>
        </div>

        <p className="mt-10 text-center text-sm leading-relaxed text-[#777881]">
          Need to change the time? Use the rescheduling link in your Cal.com confirmation email.
        </p>
      </div>
    </main>
  );
}
