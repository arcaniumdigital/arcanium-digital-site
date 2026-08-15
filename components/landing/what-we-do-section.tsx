import { ArrowRight, MapPinned, Search } from "lucide-react";

const searchExamples = [
  "best real estate agent Pelican Waters",
  "who should I sell my house with in Caloundra?",
  "best agent to sell waterfront property",
  "top real estate agent in [suburb]",
];

export function WhatWeDoSection() {
  return (
    <section className="relative overflow-hidden bg-[#08090c] px-5 py-[88px] text-[#f5f5f3] [content-visibility:auto] [contain-intrinsic-size:auto_1250px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="pointer-events-none absolute -right-64 top-20 size-[620px] rounded-full bg-[#8f33ff]/6 blur-[160px]" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="lg:col-span-5 lg:pt-6">
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#aaaab2]">
              <span className="size-1.5 rounded-full bg-[#8f33ff]" />
              What we do
            </p>
            <h2 className="mt-5 max-w-[680px] font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[clamp(3rem,4vw,4.25rem)]">
              We build the infrastructure that makes you easier to find.
            </h2>
            <p className="mt-6 max-w-[650px] text-base font-medium leading-[1.7] text-[#aaaab2] lg:text-lg">
              We create your personal Agent Portal and connect it to our SEO and GEO infrastructure. From one system, we continuously strengthen your presence across your website, Google Business Profile and relevant social platforms with suburb-focused content built around the searches vendors actually make.
            </p>
            <p className="mt-5 max-w-[650px] text-base font-semibold leading-[1.7] text-[#f5f5f3] lg:text-lg">
              The goal is simple: when someone searches for the best agent, who to sell with, or which agent they should choose in your suburb, we position your name to keep appearing.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-[20px] border border-white/10 bg-[#101114] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.22)] sm:p-7 lg:rounded-[24px] lg:p-9">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[#8f33ff]/25 bg-[#8f33ff]/9 text-[#b875ff]">
                  <Search className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777881]">The searches we build around</p>
                  <p className="mt-1.5 max-w-[540px] text-sm font-medium leading-[1.55] text-[#aaaab2]">We begin with the high-intent searches local vendors use when they are deciding which agent to trust.</p>
                </div>
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {searchExamples.map((query) => (
                  <div key={query} className="flex min-h-[84px] items-start gap-2.5 border-l border-[#8f33ff]/40 bg-white/[0.025] px-3 py-3.5 text-[13px] font-medium leading-[1.5] text-[#d7d7da] sm:text-sm">
                    <Search className="mt-0.5 size-3.5 shrink-0 text-[#8f33ff]" aria-hidden="true" />
                    <span>“{query}”</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 border-t border-white/9 pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777881]">How we expand your visibility</p>
                <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f33ff]">01</p>
                    <p className="mt-1 font-display text-sm font-semibold leading-snug text-[#f5f5f3]">Target priority searches</p>
                  </div>
                  <ArrowRight className="size-4 rotate-90 text-white/25 sm:rotate-0" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f33ff]">02</p>
                    <p className="mt-1 font-display text-sm font-semibold leading-snug text-[#f5f5f3]">Reach the #1 position</p>
                  </div>
                  <ArrowRight className="size-4 rotate-90 text-white/25 sm:rotate-0" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f33ff]">03</p>
                    <p className="mt-1 font-display text-sm font-semibold leading-snug text-[#f5f5f3]">Expand into nearby suburbs</p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-white/12 bg-[#17181d] px-4 py-4">
                  <MapPinned className="mt-0.5 size-5 shrink-0 text-[#b875ff]" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-[1.6] text-[#f5f5f3]">After we reach #1 for these priority searches, we move into lower-competition nearby suburbs to double your visibility.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
