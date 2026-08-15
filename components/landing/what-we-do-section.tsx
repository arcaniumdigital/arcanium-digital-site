import {
  ArrowDown,
  ChartNoAxesCombined,
  FileText,
  LayoutDashboard,
  MapPinned,
  Search,
  Share2,
} from "lucide-react";

const surfaces = [
  { label: "Google Search", icon: Search },
  { label: "Google Business Profile", icon: MapPinned },
  { label: "Social Platforms", icon: Share2 },
  { label: "Suburb Content", icon: FileText },
];

const searchExamples = [
  "best real estate agent Pelican Waters",
  "who should I sell my house with in Caloundra?",
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777881]">
                Your visibility infrastructure
              </p>

              <div className="mt-7 flex flex-col items-center">
                <div className="flex w-full max-w-[310px] items-center gap-3 rounded-[14px] border border-white/12 bg-[#17181d] px-4 py-3.5">
                  <LayoutDashboard className="size-5 shrink-0 text-[#b875ff]" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777881]">Central system</p>
                    <p className="mt-0.5 font-display text-base font-semibold tracking-[-0.02em] text-[#f5f5f3]">Personal Agent Portal</p>
                  </div>
                </div>

                <div className="flex h-10 flex-col items-center justify-end text-[#8f33ff]" aria-hidden="true">
                  <span className="h-5 w-px bg-[#8f33ff]/45" />
                  <ArrowDown className="size-4" />
                </div>

                <div className="w-full max-w-[390px] rounded-[14px] border border-[#8f33ff]/30 bg-[#8f33ff]/9 px-4 py-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c998ff]">Always working</p>
                  <p className="mt-1 font-display text-base font-semibold tracking-[-0.02em] text-white sm:text-lg">Arcanium SEO + GEO Infrastructure</p>
                </div>

                <div className="h-9 w-px bg-white/18" aria-hidden="true" />

                <div className="relative grid w-full grid-cols-2 gap-2.5 pt-5 sm:gap-3 lg:grid-cols-4">
                  <span className="absolute left-[12.5%] right-[12.5%] top-0 hidden h-px bg-white/14 lg:block" aria-hidden="true" />
                  {surfaces.map(({ label, icon: Icon }) => (
                    <div key={label} className="relative flex min-h-[92px] flex-col justify-between border-t border-white/12 bg-white/[0.025] px-3 py-3.5 sm:min-h-[100px] sm:px-4">
                      <span className="absolute left-1/2 top-[-21px] hidden h-5 w-px -translate-x-1/2 bg-white/14 lg:block" aria-hidden="true" />
                      <Icon className="size-4.5 text-[#aaaab2]" aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold leading-snug text-[#f5f5f3]">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="h-9 w-px bg-white/18" aria-hidden="true" />

                <div className="flex w-full max-w-[430px] items-center gap-3 rounded-[14px] border border-white/12 bg-[#17181d] px-4 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[#8f33ff]/25 bg-[#8f33ff]/9 text-[#b875ff]">
                    <ChartNoAxesCombined className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777881]">The outcome</p>
                    <p className="mt-0.5 font-display text-base font-semibold leading-snug tracking-[-0.02em] text-[#f5f5f3]">More visibility across vendor searches</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-white/9 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777881]">Searches your system is built around</p>
                <div className="mt-3 space-y-2">
                  {searchExamples.map((query) => (
                    <div key={query} className="flex items-start gap-2.5 border-l border-[#8f33ff]/40 pl-3 text-[13px] font-medium leading-[1.5] text-[#aaaab2] sm:text-sm">
                      <Search className="mt-0.5 size-3.5 shrink-0 text-[#8f33ff]" aria-hidden="true" />
                      <span>“{query}”</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
