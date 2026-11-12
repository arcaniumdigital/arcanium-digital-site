import { discoveryCtaLabel } from "@/lib/funnel-offer";
import { HeroVideo } from "@/components/landing/hero-video";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { ArrowRight } from "lucide-react";
import { FunnelMotion } from "./funnel-motion";

function HeroCta({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <MetaTrackedLink
        href="#audit"
        trackingLabel="Seller Pipeline Audit - hero"
        className="discovery-cta group inline-flex min-h-14 w-full items-center justify-center rounded-[14px] border border-white/15 bg-[#f4f4f2] px-7 text-sm font-semibold text-[#0b0c0f] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] motion-reduce:transition-none motion-safe:hover:-translate-y-px motion-safe:hover:bg-white sm:w-auto"
      >
        <span className="discovery-cta-copy">{discoveryCtaLabel}</span>
        <ArrowRight className="ml-2 size-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none motion-safe:group-hover:translate-x-1" aria-hidden="true" />
      </MetaTrackedLink>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="vsl"
      className="surface-noise relative overflow-hidden bg-[#08090c] px-5 pb-20 pt-28 text-[#f5f5f3] sm:px-6 md:px-8 lg:flex lg:min-h-[900px] lg:items-center lg:px-12 lg:pb-48 lg:pt-40"
    >
      <FunnelMotion />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#08090c]" />
      <div className="relative mx-auto grid w-full max-w-[1280px] gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div className="lg:col-span-7">
          <h1 data-motion="hero" className="max-w-[850px] font-display text-[clamp(2.25rem,8.8vw,2.75rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-[#f5f5f3] lg:text-[clamp(3rem,4.6vw,4rem)]">
            Your First <span className="motion-lead">On-Site Appraisal</span>{" "}<span className="motion-booked text-[#a95cff]">Booked in <strong className="whitespace-nowrap font-bold">7 Days.</strong></span>
            <span className="mt-5 block text-[0.72em] leading-[1.15] tracking-[-0.025em]"><strong className="whitespace-nowrap font-bold text-[#a95cff]">3 More</strong> Within the Month.</span>
            <span className="mt-4 block text-[0.58em] leading-[1.2] tracking-[-0.02em]">Or <span className="underline decoration-2 underline-offset-[0.16em]">You Don&apos;t Pay.</span></span>
          </h1>
          <HeroCta className="mt-8 hidden lg:block" />
        </div>
        <div data-motion="video" className="motion-video lg:col-span-5 lg:translate-y-7">
          <HeroVideo />
        </div>
        <HeroCta className="lg:hidden" />
      </div>
    </section>
  );
}
