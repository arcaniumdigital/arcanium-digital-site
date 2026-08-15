import Image from "next/image";

const panels = [
  { title: "May Client Analytics", image: "/images/analytics/traffic-overview.jpg", width: 1403, height: 1121, alt: "Analytics dashboard showing visitors, pageviews, bounce rate, session duration, sources, and top pages" },
  { title: "June Client Analytics", image: "/images/analytics/traffic-trend.jpg", width: 1402, height: 1122, alt: "Analytics dashboard showing a monthly visitor and pageview trend" },
  { title: "May Audience Report", image: "/images/analytics/audience-tracking.jpg", width: 1600, height: 900, alt: "Analytics dashboard showing geography, devices, and tracked vendor actions" },
  { title: "June Audience Report", image: "/images/analytics/audience-growth.jpg", width: 1600, height: 900, alt: "Analytics dashboard showing geography, devices, and tracked conversion events" },
];

export function AnalyticsSection() {
  return (
    <section id="analytics" className="relative overflow-hidden bg-[#f3f2ee] px-4 py-[88px] text-[#101114] [content-visibility:auto] [contain-intrinsic-size:auto_1800px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[760px]">
          <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#64656b]"><span className="size-1.5 rounded-full bg-[#8f33ff]" />Clear reporting. Real signals.</p>
          <h2 className="mt-5 max-w-[680px] font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[clamp(3rem,4vw,4.25rem)]">Visibility You Can Actually Measure</h2>
          <p className="mt-5 max-w-[620px] text-base font-medium leading-[1.65] text-[#64656b] lg:text-lg">See the searches, visitors and vendor actions your online presence is creating. Clear reporting makes progress easy to understand.</p>
        </div>

        <div className="mt-12 grid gap-10 lg:mt-[72px] lg:grid-cols-12 lg:gap-7">
          {panels.map((panel, index) => (
            <article key={panel.title} className={`${index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : "lg:col-span-6"}`}>
              <p className="mb-3 text-[13px] font-semibold text-[#64656b]">{panel.title}</p>
              <div className="overflow-hidden rounded-[12px] border border-black/12 bg-[#0b0c0f] p-1 shadow-[0_22px_60px_rgba(0,0,0,0.12)] transition duration-500 hover:-translate-y-[3px] hover:border-black/20 lg:rounded-[20px] lg:p-2 lg:shadow-[0_30px_80px_rgba(0,0,0,0.15)]">
                <Image src={panel.image} alt={panel.alt} width={panel.width} height={panel.height} sizes={index < 2 ? "(max-width: 1024px) calc(100vw - 32px), 760px" : "(max-width: 1024px) calc(100vw - 32px), 680px"} quality={78} className="h-auto w-full rounded-[9px] bg-white object-contain lg:rounded-[14px]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
