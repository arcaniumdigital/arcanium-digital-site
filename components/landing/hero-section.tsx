import { HeroVideo } from "@/components/landing/hero-video";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { ArrowRight } from "lucide-react";

function HeroSupportingCopy({ className = "", mobileCtaFirst = false }: { className?: string; mobileCtaFirst?: boolean }) {
  return (
    <div className={className}>
      <div className={`${mobileCtaFirst ? "hidden" : ""} max-w-[620px]`}>
        <h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-[#f5f5f3] sm:text-2xl">
          Your free plan. Personalised to your business.
        </h2>
        <p className="mt-2 text-base font-bold leading-[1.65] text-[#aaaab2] sm:text-[1.05rem] lg:text-lg">
          Get the five-step plan to generate, follow up and convert more seller enquiries, then see how to apply it to your business.
        </p>
      </div>
      <div className={`${mobileCtaFirst ? "order-1 mb-7" : "mt-7 lg:mt-8"}`}>
        <MetaTrackedLink
          href="#audit"
          trackingLabel="Seller Pipeline Audit - hero"
          className="group inline-flex min-h-14 w-full items-center justify-center rounded-[14px] border border-white/15 bg-[#f4f4f2] px-7 text-sm font-semibold text-[#0b0c0f] transition duration-300 hover:-translate-y-px hover:bg-white sm:w-auto"
        >
          Free Growth Plan + Strategy Call
          <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </MetaTrackedLink>
        <p className="mt-3 text-center text-xs leading-5 text-[#85858e] sm:text-left">
          Free 8-page PDF + 10–15 minute strategy call. No obligation.
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="vsl"
      className="surface-noise relative overflow-hidden bg-[#08090c] px-5 pb-20 pt-28 text-[#f5f5f3] sm:px-6 md:px-8 lg:flex lg:min-h-[900px] lg:items-center lg:px-12 lg:pb-48 lg:pt-40"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#08090c]" />
      <div className="relative mx-auto grid w-full max-w-[1280px] gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div className="lg:col-span-7">
          <h1 className="max-w-[850px] font-display text-[clamp(2.625rem,11vw,3.125rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[#f5f5f3] lg:text-[clamp(4rem,6.4vw,6rem)] lg:leading-[0.96]">
            Done for You<br />Lead Gen <span className="text-[#a95cff]">→ Booked Appraisals.</span>
          </h1>
          <HeroSupportingCopy className="mt-7 hidden lg:block" />
        </div>
        <div className="lg:col-span-5 lg:translate-y-7">
          <HeroVideo />
        </div>
        <HeroSupportingCopy className="flex flex-col lg:hidden" mobileCtaFirst />
      </div>
    </section>
  );
}
