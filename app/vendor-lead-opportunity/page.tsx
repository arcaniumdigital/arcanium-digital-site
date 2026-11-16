import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { QualificationNextStep } from "@/components/landing/qualification-next-step";
import { AuditBooking } from "@/components/landing/audit-booking";
import { AuditVideo } from "@/components/landing/audit-video";
import { resolveBookingContext } from "@/lib/funnel-context";
export const metadata: Metadata = { title: "Book Your 10 Minute Intro Call", description: "Review your market, current appraisal volume and whether our system is a fit.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function VendorAuditPage() {
  if (process.env.NEXT_PUBLIC_MOREVENDORS_CRM_ENABLED !== "true") return <QualificationNextStep />;
  const cookieStore=await cookies();const handle=cookieStore.get("arc_vendor_audit_ctx")?.value;
  const context=handle?await resolveBookingContext(`arc_vendor_audit_ctx=${handle}`):null;
  if (!context) redirect("/#audit");
  return <main className="mv-booking mv-shell"><div className="mv-booking-video mv-booking-video-first"><AuditVideo /></div><AuditBooking bookingFor={context.fullName} /></main>;
}
