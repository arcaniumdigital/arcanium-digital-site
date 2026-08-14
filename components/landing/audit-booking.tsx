"use client";

import * as Sentry from "@sentry/nextjs";
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
      try {
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
      } catch (caughtError) {
        if (isDisposed) return;

        Sentry.captureException(
          caughtError instanceof Error
            ? caughtError
            : new Error("UNKNOWN_CAL_EMBED_INITIALIZATION_FAILURE"),
          {
            tags: {
              funnel: "vendor-audit",
              stage: "cal-embed-initialization",
            },
          }
        );
      }
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
    <section id="booking" className="rounded-[20px] border border-white/15 bg-[#f3f2ee] p-4 text-left text-[#101114] shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[24px] sm:p-7 min-[1180px]:rounded-[28px] min-[1180px]:p-8">
      <h2 className="font-display text-[clamp(2rem,8vw,2.35rem)] font-semibold leading-[1.02] tracking-[-0.04em] min-[1180px]:text-[clamp(2rem,2.6vw,2.4rem)]">
        Book a time to talk through your audit.
      </h2>
      <p className="mt-4 max-w-xl text-base font-normal leading-[1.6] text-[#64656b]">
        Choose a time that works for you and we’ll walk through the opportunities together.
      </p>

      <div className="mt-7 overflow-hidden rounded-[16px] border border-black/10 bg-white">
        <div className="border-b border-black/8 bg-[#101116] px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white sm:text-[13px]">
          Choose a time for your audit review
        </div>
        <div className="h-[620px] bg-white sm:h-[660px] min-[1180px]:h-[590px]">
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
