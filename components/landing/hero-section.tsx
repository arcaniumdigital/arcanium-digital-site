import { HeroVideo } from "@/components/landing/hero-video";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { ArrowRight } from "lucide-react";

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
            Become the #1 Real Estate Agent{" "}
            <span className="text-[#a95cff]">Online in Your Suburb</span>
          </h1>
          <p className="mt-6 max-w-[620px] text-base font-medium leading-[1.65] text-[#aaaab2] sm:text-[1.05rem] lg:mt-7 lg:text-lg">
            We establish visibility across Google Search, Google Maps and AI platforms like ChatGPT — so when local vendors search for an agent, your name is the first they find.
          </p>
          <MetaTrackedLink
            href="#audit"
            trackingLabel="Check my online visibility - hero"
            className="group mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-[14px] border border-white/15 bg-[#f4f4f2] px-7 text-sm font-semibold text-[#0b0c0f] transition duration-300 hover:-translate-y-px hover:bg-white sm:w-auto lg:mt-8"
          >
            CHECK MY ONLINE VISIBILITY
            <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </MetaTrackedLink>
        </div>
        <div className="lg:col-span-5 lg:translate-y-7">
          <HeroVideo />
        </div>
      </div>
    </section>
  );
}
