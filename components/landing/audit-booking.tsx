"use client";

import Cal, { getCalApi, type EmbedEvent } from "@calcom/embed-react";
import { useEffect } from "react";
import type { BookingContext } from "@/lib/funnel-context";

type Props = { context: BookingContext | null; bookingSource: string };

export function AuditBooking({ context, bookingSource }: Props) {
  const eventUrl = "/api/funnel-events";

  useEffect(() => {
    if (eventUrl) void fetch(eventUrl, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "VENDOR_AUDIT_VIEWED" }),
    }).catch(() => undefined);
    let disposed = false;
    let api: Awaited<ReturnType<typeof getCalApi>> | null = null;
    const observe = (eventType: string) => {
      if (!eventUrl) return;
      void fetch(eventUrl, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType }),
      }).catch(() => undefined);
    };
    const onReady = (_event: EmbedEvent<"linkReady">) => observe("CALENDAR_READY");
    const onBooker = (_event: EmbedEvent<"navigatedToBooker">) => observe("CALENDAR_INTERACTED");
    const onBooked = (_event: EmbedEvent<"bookingSuccessfulV2">) => observe("BOOKING_OBSERVED_BROWSER");
    void (async () => {
      const cal = await getCalApi({ namespace: "vendor-audit" });
      if (disposed) return;
      api = cal;
      cal("ui", { theme: "light", cssVarsPerTheme: { light: { "cal-brand": "#8f33ff" }, dark: { "cal-brand": "#8f33ff" } }, hideEventTypeDetails: true, layout: "month_view" });
      cal("on", { action: "linkReady", callback: onReady });
      cal("on", { action: "navigatedToBooker", callback: onBooker });
      cal("on", { action: "bookingSuccessfulV2", callback: onBooked });
    })();
    return () => {
      disposed = true;
      api?.("off", { action: "linkReady", callback: onReady });
      api?.("off", { action: "navigatedToBooker", callback: onBooker });
      api?.("off", { action: "bookingSuccessfulV2", callback: onBooked });
    };
  }, [eventUrl]);

  const config: Record<string, string> = {
    layout: "month_view",
    useSlotsViewOnSmallScreen: "true",
    theme: "light",
    "metadata[source]": bookingSource,
  };
  if (context?.fullName) config.name = context.fullName;
  if (context?.phoneE164) config.location = JSON.stringify({ value: "phone", optionValue: context.phoneE164 });
  if (context?.signedLeadCorrelation) config["metadata[leadCorrelation]"] = context.signedLeadCorrelation;

  return (
    <section className="mt-12 text-left sm:mt-16">
      <h2 className="text-center font-display text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-tight">Book a time to talk through your audit.</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-base font-medium leading-relaxed text-[#111114]/58">Choose a time that works for you and we’ll walk through the opportunities together.</p>
      <div data-funnel-marker="vendor-audit-booking" className="mt-7 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(63,32,94,0.14)]">
        <div className="bg-[#8f33ff] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">Choose a time for your audit review</div>
        <div className="h-[620px] bg-white">
          <Cal namespace="vendor-audit" calLink={process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? ""} style={{ width: "100%", height: "100%", overflow: "scroll" }} config={config} />
        </div>
      </div>
    </section>
  );
}
