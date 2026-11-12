import { HeroVideo } from "@/components/landing/hero-video";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { ArrowRight, Check } from "lucide-react";
import { FunnelMotion } from "./funnel-motion";

export function HeroSection() {
  return (
    <section id="vsl" className="relative overflow-hidden bg-[#0a0b0d] px-5 pb-28 pt-32 text-[#f7f6f2] sm:px-6 md:px-8 lg:flex lg:min-h-[860px] lg:items-center lg:px-12 lg:pb-44 lg:pt-36">
      <FunnelMotion />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(128,82,214,.14),transparent_34%)]" />
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
        <div className="lg:col-span-6">
          <h1 data-motion="hero" className="max-w-[720px] font-display text-[clamp(2.75rem,9vw,4.1rem)] font-medium leading-[.96] tracking-[-0.04em] text-[#f7f6f2] lg:text-[clamp(4rem,5.5vw,5.35rem)]">
            Turn seller enquiries into booked appraisals.
          </h1>
          <p className="mt-7 max-w-[610px] text-lg leading-[1.65] text-[#a8aaa6] lg:text-xl">
            We run the campaign, respond to every enquiry and move ready homeowners toward an appointment.
          </p>
          <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - hero" className="group mt-9 inline-flex min-h-14 items-center justify-center rounded-[12px] bg-[#f4f3ef] px-6 text-sm font-semibold text-[#111210] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white">
            Book a free discovery call
            <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </MetaTrackedLink>
          <p className="mt-5 flex items-center gap-2 text-sm text-[#8f928d]"><Check className="size-4 text-[#a88bea]" aria-hidden="true" />First on-site appraisal within 7 days, or you don&apos;t pay.</p>
        </div>
        <div data-motion="video" className="motion-video lg:col-span-6">
          <HeroVideo />
        </div>
      </div>
    </section>
  );
}
