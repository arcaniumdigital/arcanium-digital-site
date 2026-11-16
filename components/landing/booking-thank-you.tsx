"use client";



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

    const title = booking.title || "Discovery Call with Arcanium Digital";
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Arcanium Digital//Discovery Call//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${escapeCalendarText(booking.uid || crypto.randomUUID())}@arcaniumdigital.com`,
      `DTSTAMP:${calendarTimestamp(new Date().toISOString())}`,
      `DTSTART:${calendarTimestamp(booking.startTime)}`,
      `DTEND:${calendarTimestamp(booking.endTime)}`,
      `SUMMARY:${escapeCalendarText(title)}`,
      `DESCRIPTION:${escapeCalendarText("Your discovery call with Arcanium Digital. Your booking confirmation email contains the meeting details and rescheduling link.")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcanium-strategy-call.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  const validBooking = Boolean(booking?.uid && booking.startTime && booking.endTime && Number.isFinite(Date.parse(booking.startTime)) && Number.isFinite(Date.parse(booking.endTime)));
  return <main className="mv-confirmation mv-shell">
    <a href="/" className="mv-confirmation-brand">More Vendors</a>
    <h1>{validBooking ? "Your Call Is Booked." : "Check Your Booking"}</h1>
    {validBooking && booking ? <>
      <p>We look forward to speaking with you.</p>
      <dl><div><dt>Meeting</dt><dd>{booking.title || "Discovery Call"}</dd></div><div><dt>Date and time</dt><dd>{new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.startTime!))}</dd></div><div><dt>Timezone</dt><dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd></div></dl>
      {hasCalendarEvent && <button type="button" onClick={addToCalendar} className="mv-button">Add booking to calendar</button>}
      <p>Check your confirmation email for meeting details and the link to reschedule or cancel.</p>
    </> : <><p>We cannot display a confirmed appointment in this browser. Check your confirmation email, or return to the calendar to choose a time.</p><a href="/vendor-lead-opportunity" className="mv-button">View Calendar</a></>}
  </main>;
}
