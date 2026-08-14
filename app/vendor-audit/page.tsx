import { AuditBooking } from "@/components/landing/audit-booking";
import { AuditHeader } from "@/components/landing/audit-header";
import { AuditVideo } from "@/components/landing/audit-video";
import { bookingTokenCookieName, normalizeBookingToken } from "@/lib/booking-tracking";
import type { Metadata } from "next";
import { cookies } from "next/headers";

const title = "Book Your Free 15-Minute Visibility Audit";
const description = "Identify the biggest gap in your online visibility and what needs fixing.";
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

export default async function VendorAuditPage() {
  const cookieStore = await cookies();
  const bookingToken = normalizeBookingToken(cookieStore.get(bookingTokenCookieName)?.value);

  return (
    <>
      <AuditHeader />
      <main id="audit-top" className="relative min-h-screen bg-[#08090c] text-[#f5f5f3]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_79%_26%,rgba(143,51,255,0.13),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:48px_48px]" />

        <section className="relative mx-auto grid min-h-screen max-w-[1240px] gap-12 px-5 pb-20 pt-[112px] sm:px-7 sm:pb-24 sm:pt-[126px] lg:px-10 min-[1180px]:grid-cols-12 min-[1180px]:items-center min-[1180px]:gap-12 min-[1180px]:pb-20 min-[1180px]:pt-[126px] xl:px-0">
          <div className="min-w-0 min-[1180px]:col-span-7 min-[1180px]:pr-2">
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#a6a6ae] sm:text-[13px]">
              <span className="size-1.5 rounded-full bg-[#8f33ff]" aria-hidden="true" />
              Suburb Visibility Audit
            </p>
            <h1 className="mt-5 max-w-[820px] font-display text-[clamp(2.625rem,11vw,3rem)] font-semibold leading-[0.99] tracking-[-0.045em] text-[#f5f5f3] sm:text-[clamp(3rem,8vw,4.25rem)] min-[1180px]:text-[clamp(3.5rem,5.5vw,5.125rem)]">
              See where you stand before your next vendor searches.
            </h1>
            <p className="mt-6 max-w-[570px] text-[16px] font-normal leading-[1.65] text-[#a6a6ae] sm:text-lg">
              Watch the audit, then book a time to review the biggest opportunities across Google and AI search.
            </p>

            <div className="relative mt-9 max-w-[760px] sm:mt-10">
              <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[20px] border border-[#8f33ff]/20 bg-[#15161c]/70 sm:translate-x-4 sm:translate-y-4 sm:rounded-[24px]" />
              <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-[#101116] p-1.5 shadow-[0_38px_100px_rgba(0,0,0,0.48)] sm:rounded-[24px] sm:p-2">
                <AuditVideo />
              </div>
            </div>
          </div>

          <div className="min-w-0 max-sm:-mx-2 min-[1180px]:col-span-5">
            <AuditBooking initialBookingToken={bookingToken} />
          </div>
        </section>
      </main>
    </>
  );
}
