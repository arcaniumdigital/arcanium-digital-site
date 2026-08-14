import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

const showcaseImages = [
  { title: "Suburb SEO Authority", image: "/images/showcase/mary-ann.png", width: 1672, height: 941, alt: "Arcanium suburb SEO authority operations system" },
  { title: "Premium Local Positioning", image: "/images/showcase/mary-ann-strategy.png", width: 2880, height: 1598, alt: "Mary-Ann McLoughlin website positioning section example" },
  { title: "Built for Google & AI Search", image: "/images/showcase/built-for-google-ai-search.png", width: 1672, height: 941, alt: "Arcanium listing publishing and search visibility result example" },
];

export function AutonomousSection() {
  return (
    <section id="showcase" className="relative overflow-visible bg-[#f3f2ee] px-4 py-[88px] text-[#101114] [content-visibility:auto] [contain-intrinsic-size:auto_1900px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-[760px]">
          <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#64656b]"><span className="size-1.5 rounded-full bg-[#8f33ff]" />An asset you control</p>
          <h2 className="mt-5 max-w-[650px] font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[clamp(3rem,4vw,4.25rem)]">Your Own Authority Platform</h2>
          <p className="mt-5 max-w-[650px] text-base font-medium leading-[1.65] text-[#64656b] lg:text-lg">Instead of relying entirely on realestate.com.au, Domain, RateMyAgent and your agency profile, we build you an online asset you control.</p>
        </div>

        <div className="mt-12 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-36">
              <div className="space-y-6 border-l border-black/10 pl-5">
                {showcaseImages.map((item, index) => (
                  <div key={item.title}>
                    <p className="text-xs font-semibold text-[#8f33ff]">0{index + 1}</p>
                    <p className="mt-1 font-display text-lg font-medium tracking-[-0.025em] text-[#101114]">{item.title}</p>
                  </div>
                ))}
              </div>
              <MetaTrackedLink href="https://maryannmcloughlin.com" target="_blank" rel="noreferrer" trackingLabel="View the live example" className="group mt-9 inline-flex min-h-12 items-center justify-center rounded-[14px] border border-black/12 bg-transparent px-5 text-sm font-semibold text-[#101114] transition duration-300 hover:-translate-y-px hover:border-black/25">
                View the live example
                <ArrowUpRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </MetaTrackedLink>
            </div>
          </aside>

          <div className="space-y-12 lg:col-span-9 lg:space-y-24">
            {showcaseImages.map((item, index) => (
              <article key={item.title} className={`lg:sticky lg:top-28 ${index === 0 ? "lg:z-10" : index === 1 ? "lg:z-20" : "lg:z-30"}`}>
                <p className="mb-3 text-[13px] font-semibold text-[#64656b] lg:hidden">{item.title}</p>
                <div className="overflow-hidden rounded-[16px] border border-black/12 bg-[#0c0d10] shadow-[0_24px_60px_rgba(0,0,0,0.13)] lg:rounded-[22px] lg:shadow-[0_34px_90px_rgba(0,0,0,0.16)]">
                  <div className="hidden h-[38px] items-center gap-2 border-b border-white/8 px-4 lg:flex">
                    <span className="size-2 rounded-full bg-white/18" />
                    <span className="size-2 rounded-full bg-white/18" />
                    <span className="size-2 rounded-full bg-white/18" />
                  </div>
                  <div className="bg-white p-1.5 lg:p-2">
                    <Image src={item.image} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 1024px) calc(100vw - 32px), 920px" quality={76} className="h-auto w-full rounded-[12px] object-contain object-top lg:rounded-[16px]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center lg:hidden">
          <MetaTrackedLink href="https://maryannmcloughlin.com" target="_blank" rel="noreferrer" trackingLabel="View the live example" className="group inline-flex min-h-12 items-center justify-center rounded-[14px] border border-black/12 bg-transparent px-5 text-sm font-semibold text-[#101114] transition duration-300 hover:-translate-y-px hover:border-black/25">
            View the live example
            <ArrowUpRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </MetaTrackedLink>
        </div>
      </div>
    </section>
  );
}
