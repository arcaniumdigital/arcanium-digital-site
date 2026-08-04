import { AuditBooking } from "@/components/landing/audit-booking";
import { WistiaPlayTracker } from "@/components/analytics/wistia-play-tracker";
import {
  bookingTokenCookieName,
  normalizeBookingToken,
} from "@/lib/booking-tracking";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";

const title = "Book Your Free 15-Minute Vendor Audit";
const description =
  "Identify the biggest gap in your online presence and what needs fixing.";
const canonicalUrl = "https://www.arcaniumdigital.com/vendor-audit";
const previewImageUrl =
  "https://www.arcaniumdigital.com/vendor-audit-preview.jpg";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    type: "website",
    siteName: "Arcanium",
    title,
    description,
    url: canonicalUrl,
    images: [
      {
        url: previewImageUrl,
        width: 1200,
        height: 630,
        alt: "Arcanium Vendor Audit preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [previewImageUrl],
  },
};

export default async function VendorAuditPage() {
  const cookieStore = await cookies();
  const bookingToken = normalizeBookingToken(
    cookieStore.get(bookingTokenCookieName)?.value
  );

  return (
    <main className="min-h-screen bg-[#f6f4f8] px-5 py-12 text-[#111114] sm:px-6 sm:py-16 lg:px-12 lg:py-20">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src="https://fast.wistia.com/embed/l33mw4dw0k.js" strategy="afterInteractive" type="module" />
      <style>{`
        wistia-player[media-id="l33mw4dw0k"] {
          display: block;
          height: 100%;
          width: 100%;
        }

        wistia-player[media-id="l33mw4dw0k"]:not(:defined) {
          background: center / contain no-repeat url("https://fast.wistia.com/embed/medias/l33mw4dw0k/swatch");
          display: block;
          filter: blur(5px);
          padding-top: 56.25%;
        }
      `}</style>

      <div className="mx-auto max-w-[980px] text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#8f33ff]">Vendor Conversion Audit</p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,5.4rem)] font-black leading-[0.92] tracking-tight">
          See what vendors see before they choose an agent.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-[#111114]/58 md:text-lg">
          Watch the audit, then book a time to talk through the gaps that could be costing you listing opportunities.
        </p>

        <div className="mt-9 overflow-hidden rounded-[18px] border border-black/10 bg-white p-2 shadow-[0_28px_80px_rgba(63,32,94,0.14)]">
          <div className="aspect-video overflow-hidden rounded-[12px] bg-black">
            <div
              className="h-full w-full"
              dangerouslySetInnerHTML={{
                __html:
                  '<wistia-player media-id="l33mw4dw0k" aspect="1.7777777777777777" player-color="#8f33ff"></wistia-player>',
                }}
            />
            <WistiaPlayTracker
              mediaId="l33mw4dw0k"
              placement="Vendor audit page"
            />
          </div>
        </div>

        <AuditBooking initialBookingToken={bookingToken} />
      </div>
    </main>
  );
}
