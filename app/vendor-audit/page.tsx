import { AuditBooking } from "@/components/landing/audit-booking";
import { AuditVideo } from "@/components/landing/audit-video";
import { bookingTokenCookieName } from "@/lib/booking-tracking";
import { resolveBookingContext } from "@/lib/funnel-context";
import type { Metadata } from "next";
import { cookies } from "next/headers";

const title = "Book Your Free Call";
const description = "See where you could be missing vendor searches across Google and AI.";
const canonicalUrl = "https://www.arcaniumdigital.com/vendor-audit";
const previewImageUrl = "https://www.arcaniumdigital.com/vendor-audit-preview.jpg";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "website",
    siteName: "Arcanium",
    title,
    description,
    url: canonicalUrl,
    images: [{ url: previewImageUrl, width: 1200, height: 630, alt: "Arcanium Visibility Audit preview" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [previewImageUrl] },
};

function VisibilityReviewCopy({ className }: { className: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-[clamp(2rem,8vw,2.35rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#f5f5f3] min-[1180px]:text-[clamp(2rem,2.6vw,2.4rem)]">
        See how visible you are to local vendors.
      </h2>
      <p className="mt-4 text-[16px] font-normal leading-[1.65] text-[#a6a6ae] sm:text-lg">
        Book a <strong>free call</strong> to discuss your current
        online presence and what you’d like to improve.
      </p>
      <p className="mt-4 text-[16px] font-normal leading-[1.65] text-[#a6a6ae] sm:text-lg">
        If there’s an opportunity to help, we’ll then prepare your{" "}
        <strong>local visibility report</strong> and walk you through the search
        demand and opportunities in your market.
      </p>
      <p className="mt-4 text-[16px] font-semibold leading-[1.65] text-[#f5f5f3] sm:text-lg">
        No preparation. No obligation. Just a clear next step.
      </p>
    </div>
  );
}

export default async function VendorAuditPage() {
  const cookieStore = await cookies();
  const sessionHandle = cookieStore.get(bookingTokenCookieName)?.value ?? "";
  const bookingContext = sessionHandle
    ? await resolveBookingContext(`${bookingTokenCookieName}=${sessionHandle}`)
    : null;

  return (
    <>
      <main id="audit-top" className="relative min-h-screen bg-[#08090c] text-[#f5f5f3]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_79%_26%,rgba(143,51,255,0.13),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:48px_48px]" />

        <section className="relative mx-auto grid min-h-screen max-w-[1240px] gap-12 px-5 py-14 sm:px-7 sm:py-16 lg:px-10 min-[1180px]:grid-cols-12 min-[1180px]:items-center min-[1180px]:gap-12 min-[1180px]:py-20 xl:px-0">
          <div className="contents min-[1180px]:order-none min-[1180px]:col-span-7 min-[1180px]:block min-[1180px]:min-w-0 min-[1180px]:pr-2">
            <h1 className="order-1 max-w-[820px] font-display text-[clamp(2.625rem,11vw,3rem)] font-semibold leading-[0.99] tracking-[-0.045em] text-[#f5f5f3] sm:text-[clamp(3rem,8vw,4.25rem)] min-[1180px]:text-[clamp(3.5rem,5.5vw,5.125rem)]">
              See where you could be missing vendor searches.
            </h1>

            <div data-testid="audit-video-card" className="relative order-3 max-w-[760px] min-[1180px]:mt-9 min-[1180px]:order-none sm:min-[1180px]:mt-10">
              <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[20px] border border-[#8f33ff]/20 bg-[#15161c]/70 sm:translate-x-4 sm:translate-y-4 sm:rounded-[24px]" />
              <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-[#101116] p-1.5 shadow-[0_38px_100px_rgba(0,0,0,0.48)] sm:rounded-[24px] sm:p-2">
                <AuditVideo />
              </div>
            </div>

            <VisibilityReviewCopy className="order-4 max-w-[570px] min-[1180px]:mt-9 min-[1180px]:block" />
          </div>

          <div className="order-2 min-w-0 max-sm:-mx-2 min-[1180px]:order-none min-[1180px]:col-span-5">
            <AuditBooking
              initialFullName={bookingContext?.fullName}
              initialLeadCorrelation={bookingContext?.signedLeadCorrelation}
            />
          </div>
        </section>
      </main>
    </>
  );
}
