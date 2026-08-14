import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#f3f2ee] px-3 py-16 text-white sm:px-4 lg:px-12 lg:py-32">
      <div className="surface-noise relative mx-auto flex min-h-[430px] max-w-[1280px] items-center overflow-hidden rounded-[22px] border border-black/10 bg-[#08090c] px-5 py-16 lg:min-h-[540px] lg:rounded-[32px] lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8f33ff]/10 blur-[150px]" />
        <div className="relative mx-auto max-w-[900px] text-center">
        <h2 className="font-display text-[clamp(2.375rem,10vw,2.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] lg:text-[clamp(3.25rem,5vw,4.875rem)]">Who Owns Your Suburb Online Right Now?</h2>
        <p className="mx-auto mt-6 max-w-[650px] text-base font-medium leading-[1.65] text-[#aaaab2] lg:text-lg">See which suburb searches you currently appear for, which competitors are being shown instead, and the biggest opportunities to improve your visibility across Google and AI.</p>
        <MetaTrackedLink href="#audit" trackingLabel="Show me where I stand - final CTA" className="group mt-8 inline-flex min-h-[58px] w-full items-center justify-center rounded-[14px] border border-white/15 bg-[#f4f4f2] px-8 text-sm font-semibold text-[#0b0c0f] transition-all duration-300 hover:-translate-y-px hover:bg-white sm:w-auto">
          SHOW ME WHERE I STAND
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </MetaTrackedLink>
        </div>
      </div>
    </section>
  );
}
