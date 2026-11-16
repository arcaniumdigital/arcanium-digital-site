"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bookingConfirmationStorageKey } from "@/lib/booking-tracking";
import { trackMetaEvent } from "@/lib/meta-pixel";

type Booking = { uid: string; title?: string; startTime: string; endTime: string };
type SlotsResponse = { slots?: string[]; timezone?: string; booking?: Booking; error?: string };
type AuditBookingProps = { bookingFor?: string };

function dateKey(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function saveBooking(booking: Booking) {
  try {
    sessionStorage.setItem(bookingConfirmationStorageKey, JSON.stringify(booking));
    const key = `morevendors:schedule:${booking.uid}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      trackMetaEvent("Schedule", { content_name: "Seller Pipeline Audit", content_category: "GHL confirmed booking", booking_id: booking.uid });
    }
  } catch { /* The confirmation page can still resolve the booking from the secure session. */ }
}

export function AuditBooking({ bookingFor }: AuditBookingProps = {}) {
  const router = useRouter();
  const [timezone, setTimezone] = useState("Australia/Brisbane");
  const [slots, setSlots] = useState<string[]>([]);
  const [activeDate, setActiveDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [datePage, setDatePage] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "booking" | "error">("loading");
  const [message, setMessage] = useState("");

  const grouped = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const slot of slots) {
      const key = dateKey(slot, timezone);
      result.set(key, [...(result.get(key) ?? []), slot]);
    }
    return result;
  }, [slots, timezone]);
  const dates = useMemo(() => [...grouped.keys()], [grouped]);
  const visibleDates = dates.slice(datePage * 4, datePage * 4 + 4);
  const activeSlots = grouped.get(activeDate) ?? [];

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Brisbane";
    const controller = new AbortController();
    async function loadSlots() {
      try {
        const response = await fetch(`/vendor-lead-opportunity/slots?timezone=${encodeURIComponent(browserTimezone)}`, {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json() as SlotsResponse;
        if (result.booking?.uid) {
          saveBooking(result.booking);
          router.replace("/thank-you-for-booking");
          return;
        }
        if (!response.ok || !Array.isArray(result.slots)) throw new Error(result.error || "BOOKING_SERVICE_UNAVAILABLE");
        const nextTimezone = result.timezone || browserTimezone;
        setTimezone(nextTimezone);
        setSlots(result.slots);
        const firstDate = result.slots[0] ? dateKey(result.slots[0], nextTimezone) : "";
        setActiveDate(firstDate);
        setStatus("ready");
        if (!result.slots.length) setMessage("No times are currently available. Please check again shortly.");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error && error.message === "BOOKING_SESSION_REQUIRED"
          ? "Your secure booking link has expired. Please return to the qualification form."
          : "The calendar is temporarily unavailable. Please try again.");
      }
    }
    void loadSlots();
    return () => controller.abort();
  }, [router]);

  async function confirmBooking() {
    if (!selectedSlot || status === "booking") return;
    setStatus("booking");
    setMessage("");
    try {
      const response = await fetch("/vendor-lead-opportunity/book", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: selectedSlot, timezone }),
      });
      const result = await response.json() as { booking?: Booking; error?: string };
      if (!response.ok || !result.booking?.uid) {
        if (response.status === 409) {
          setSlots(current => current.filter(slot => slot !== selectedSlot));
          setSelectedSlot("");
          setStatus("ready");
          setMessage("That time was just taken. Please choose another available time.");
          return;
        }
        throw new Error(result.error || "BOOKING_FAILED");
      }
      saveBooking(result.booking);
      router.push("/thank-you-for-booking");
    } catch {
      setStatus("error");
      setMessage("We couldn’t confirm that booking. Please try again.");
    }
  }

  function chooseDate(key: string) {
    setActiveDate(key);
    setSelectedSlot("");
    setMessage("");
  }

  const dateFormatter = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, weekday: "short", day: "numeric", month: "short" });
  const timeFormatter = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
  const zoneLabel = timezone.replaceAll("_", " ");

  return <section id="booking" aria-label="Booking calendar" className="mv-custom-calendar">
    <div className="mv-calendar-heading">
      <div><span>LAST STEP</span><h1>Choose your 10 minute call</h1></div>
      <p>Your details are already saved. Just choose a time.</p>
      {bookingFor ? <p className="mv-calendar-identity">
        Booking for <strong>{bookingFor}</strong>. <a href="/vendor-lead-opportunity/reset">Not you?</a>
      </p> : null}
    </div>

    {status === "loading" ? <div className="mv-calendar-loading" role="status"><span />Loading available times…</div> : null}

    {status !== "loading" && dates.length ? <>
      <div className="mv-calendar-month">
        <button type="button" aria-label="Previous dates" disabled={datePage === 0} onClick={() => setDatePage(page => Math.max(0, page - 1))}>‹</button>
        <strong>{new Intl.DateTimeFormat("en-AU", { timeZone: timezone, month: "long", year: "numeric" }).format(new Date(grouped.get(visibleDates[0])?.[0] ?? slots[0]))}</strong>
        <button type="button" aria-label="Next dates" disabled={(datePage + 1) * 4 >= dates.length} onClick={() => setDatePage(page => page + 1)}>›</button>
      </div>
      <div className="mv-calendar-days" role="group" aria-label="Choose a date">
        {visibleDates.map(key => {
          const value = grouped.get(key)?.[0] ?? "";
          const [weekday, day, month] = dateFormatter.format(value ? new Date(value) : new Date()).replace(",", "").split(" ");
          return <button key={key} type="button" className={key === activeDate ? "is-selected" : ""} aria-pressed={key === activeDate} onClick={() => chooseDate(key)}>
            <span>{weekday}</span><strong>{day}</strong><small>{month}</small>
          </button>;
        })}
      </div>
      <p className="mv-calendar-zone">Times shown in {zoneLabel}</p>
      <div className="mv-calendar-times" role="group" aria-label="Choose an available time">
        {activeSlots.map(slot => <button key={slot} type="button" className={slot === selectedSlot ? "is-selected" : ""} aria-pressed={slot === selectedSlot} onClick={() => { setSelectedSlot(slot); setMessage(""); }}>
          {timeFormatter.format(new Date(slot))}
        </button>)}
      </div>
      <div className="mv-calendar-selection" aria-live="polite">
        <div><span>Selected time</span><strong>{selectedSlot ? `${dateFormatter.format(new Date(selectedSlot))} · ${timeFormatter.format(new Date(selectedSlot))}` : "Choose a time above"}</strong></div>
        <span className="mv-details-saved">Details saved ✓</span>
      </div>
      <button type="button" className="mv-calendar-confirm" disabled={!selectedSlot || status === "booking"} onClick={confirmBooking}>
        {status === "booking" ? "Confirming…" : "Confirm booking"}<span aria-hidden="true">→</span>
      </button>
      <p className="mv-calendar-note">Nothing is booked until you confirm.</p>
    </> : null}

    {message ? <p className={status === "error" ? "mv-calendar-message is-error" : "mv-calendar-message"} role="status">{message}</p> : null}
    {status === "error" ? <button type="button" className="mv-calendar-retry" onClick={() => window.location.reload()}>Try again</button> : null}
  </section>;
}
