"use client";

import Cal, { getCalApi, type EmbedEvent } from "@calcom/embed-react";
import { useEffect, useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
import {
  bookingTokenStorageKey,
  normalizeBookingToken,
} from "@/lib/booking-tracking";
const trackedBookingStoragePrefix = "arcanium:meta-schedule:";

interface BookingPageContext {
  bookingToken: string;
  search: string;
}

interface AuditBookingProps {
  initialBookingToken?: string;
}

export function AuditBooking({
  initialBookingToken = "",
}: AuditBookingProps) {
  const [pageContext, setPageContext] = useState<BookingPageContext | null>(
    null
  );

  useEffect(() => {
    let search = window.location.search;

    try {
      search = window.parent.location.search || search;
    } catch {
      // A cross-origin parent cannot be read, so use this page's own query string.
    }

    const searchParams = new URLSearchParams(search);
    const urlBookingToken = normalizeBookingToken(
      searchParams.get("metadata[booking_token]") ||
        searchParams.get("r") ||
        ""
    );
    let storedBookingToken = "";

    try {
      if (urlBookingToken) {
        window.sessionStorage.setItem(
          bookingTokenStorageKey,
          urlBookingToken
        );
      } else {
        storedBookingToken =
          window.sessionStorage.getItem(bookingTokenStorageKey) || "";
      }
    } catch {
      // Continue with URL metadata if session storage is unavailable.
    }

    const bookingToken =
      urlBookingToken ||
      normalizeBookingToken(initialBookingToken) ||
      normalizeBookingToken(storedBookingToken);

    if (urlBookingToken) {
      searchParams.delete("metadata[booking_token]");
      searchParams.delete("r");
      const cleanSearch = searchParams.toString();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`
      );
    }

    setPageContext({
      bookingToken,
      search,
    });

    let calApi: Awaited<ReturnType<typeof getCalApi>> | null = null;
    let isDisposed = false;

    const handleBookingSuccessful = (
      event: EmbedEvent<"bookingSuccessfulV2">
    ) => {
      const booking = event.detail.data;
      const bookingIdentifier = booking.uid || bookingToken || "unknown";
      const trackingKey = `${trackedBookingStoragePrefix}${bookingIdentifier}`;

      try {
        if (window.sessionStorage.getItem(trackingKey)) return;
        window.sessionStorage.setItem(trackingKey, "1");
      } catch {
        // Track without browser-storage deduplication when storage is unavailable.
      }

      trackMetaEvent("Schedule", {
        content_name: "Vendor Audit Review",
        content_category: "Cal.com booking",
        booking_id: bookingIdentifier,
      });
    };

    (async function () {
      const cal = await getCalApi({ namespace: "magnet" });
      if (isDisposed) return;

      calApi = cal;

      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#8f33ff" },
          dark: { "cal-brand": "#8f33ff" },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });

      cal("on", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSuccessful,
      });
    })();

    return () => {
      isDisposed = true;
      calApi?.("off", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSuccessful,
      });
    };
  }, [initialBookingToken]);

  const params = new URLSearchParams(pageContext?.search ?? "");

  return (
    <section className="mt-12 text-left sm:mt-16">
      <h2 className="text-center font-display text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-tight">
        Book a time to talk through your audit.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-base font-medium leading-relaxed text-[#111114]/58">
        Choose a time that works for you and we’ll walk through the opportunities together.
      </p>

      <div className="mt-7 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(63,32,94,0.14)]">
        <div className="bg-[#8f33ff] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
          Choose a time for your audit review
        </div>
        <div className="h-[540px] bg-white">
          {pageContext !== null && (
            <Cal
              namespace="magnet"
              calLink="arcaniumdigital/magnet"
              style={{ width: "100%", height: "100%", overflow: "scroll" }}
              config={{
                layout: "month_view",
                useSlotsViewOnSmallScreen: "true",
                theme: "light",
                name: params.get("name") || "",
                email: params.get("email") || "",
                "metadata[lead_id]": params.get("metadata[lead_id]") || "",
                "metadata[booking_token]": pageContext.bookingToken,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
