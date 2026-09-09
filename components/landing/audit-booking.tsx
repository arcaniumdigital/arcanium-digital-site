"use client";

import * as Sentry from "@sentry/nextjs";
import Cal, { getCalApi, type EmbedEvent } from "@calcom/embed-react";
import { useEffect, useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
const trackedBookingStoragePrefix = "arcanium:meta-schedule:";

interface BookingPageContext {
  fullName: string;
  leadCorrelation: string;
}

interface AuditBookingProps {
  initialFullName?: string;
  initialLeadCorrelation?: string;
}

export function AuditBooking({
  initialFullName = "",
  initialLeadCorrelation = "",
}: AuditBookingProps) {
  const [pageContext, setPageContext] = useState<BookingPageContext | null>(
    null
  );

  useEffect(() => {
    const contextFrame = window.requestAnimationFrame(() => {
      setPageContext({
        fullName: initialFullName,
        leadCorrelation: initialLeadCorrelation,
      });
    });

    let calApi: Awaited<ReturnType<typeof getCalApi>> | null = null;
    let isDisposed = false;

    const handleBookingSuccessful = (
      event: EmbedEvent<"bookingSuccessfulV2">
    ) => {
      const booking = event.detail.data;
      const bookingIdentifier = booking.uid || "unknown";
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
      window.cancelAnimationFrame(contextFrame);
      calApi?.("off", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSuccessful,
      });
    };
  }, [initialFullName, initialLeadCorrelation]);

  return (
    <section id="booking" className="rounded-[20px] border border-white/15 bg-[#f3f2ee] p-4 text-left text-[#101114] shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[24px] sm:p-7 min-[1180px]:rounded-[28px] min-[1180px]:p-8">
      <h2 className="font-display text-[clamp(2rem,8vw,2.35rem)] font-semibold leading-[1.02] tracking-[-0.04em] min-[1180px]:text-[clamp(2rem,2.6vw,2.4rem)]">
        Your details are in.
      </h2>

      <p className="mt-4 text-[15px] font-medium leading-[1.6] text-[#55565d] sm:text-base">
        Choose a time for a short call so we can confirm your primary suburb and what you’d like to improve before preparing your free Suburb Visibility Audit.
      </p>

      <div className="mt-6 overflow-hidden rounded-[16px] border border-black/10 bg-white">
        <div className="border-b border-black/8 bg-[#101116] px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white sm:text-[13px]">
          Select a time below.
        </div>
        <div data-testid="audit-calendar-frame" className="h-[455px] bg-white sm:h-[540px] min-[1180px]:h-[560px]">
          {pageContext !== null && (
            <Cal
              namespace="magnet"
              calLink="arcaniumdigital/magnet"
              style={{ width: "100%", height: "100%", overflow: "auto" }}
              config={{
                layout: "month_view",
                useSlotsViewOnSmallScreen: "true",
                theme: "light",
                name: pageContext.fullName,
                "metadata[leadCorrelation]": pageContext.leadCorrelation,
                "metadata[source]": pageContext.leadCorrelation
                  ? "website_same_session"
                  : "direct_or_sms",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
