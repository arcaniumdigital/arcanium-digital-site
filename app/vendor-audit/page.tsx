import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AuditBooking } from "@/components/landing/audit-booking";
import { resolveBookingContext } from "@/lib/funnel-context";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book Your Free 15-Minute Vendor Audit",
  description: "Identify the biggest gap in your online presence and what needs fixing.",
  alternates: { canonical: `${siteUrl}/vendor-audit` },
};

export default async function VendorAuditPage() {
  const store = await cookies();
  const contextCookie = store.get("arc_vendor_audit_ctx");
  const context = await resolveBookingContext(contextCookie ? `arc_vendor_audit_ctx=${contextCookie.value}` : "");
  const bookingSource = store.get("arc_booking_source")?.value === "sms" ? "sms" : "direct_or_unknown";
  return (
    <main className="min-h-screen bg-[#f6f4f8] px-5 py-12 text-[#111114] sm:px-6 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[980px] text-center">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.18em] text-[#8f33ff]">Arcanium Digital</Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#8f33ff]">Vendor Conversion Audit</p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,5.4rem)] font-black leading-[0.92] tracking-tight">See what vendors see before they choose an agent.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-[#111114]/58 md:text-lg">Book your free 15-minute audit. We’ll identify the biggest online trust gap and explain the most practical next step.</p>
        <AuditBooking context={context} bookingSource={bookingSource} />
      </div>
    </main>
  );
}
