const panels = [
  {
    title: "May Vendor Analytics",
    image: "/images/analytics/traffic-overview.jpg",
    alt: "Analytics dashboard showing visitors, pageviews, bounce rate, session duration, sources, and top pages",
  },
  {
    title: "June Vendor Analytics",
    image: "/images/analytics/traffic-trend.jpg",
    alt: "Analytics dashboard showing a monthly visitor and pageview trend",
  },
  {
    title: "May Audience Report",
    image: "/images/analytics/audience-tracking.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked vendor actions",
  },
  {
    title: "June Audience Report",
    image: "/images/analytics/audience-growth.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked conversion events",
  },
];

const scrollingPanels = [...panels, ...panels];

export function AnalyticsSection() {
  return (
    <section id="analytics" className="relative overflow-hidden bg-white px-5 py-20 sm:px-6 lg:px-12 lg:py-24">
      <style>{`
        @keyframes vendor-wins-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 10px));
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-10 max-w-[760px] text-center">
          <h2 className="font-display text-[clamp(2.35rem,5vw,4.7rem)] font-black leading-[0.92] tracking-tight text-[#111114]">
            More vendor wins
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-[#111114]/58 md:text-lg">
            Your site should show what is getting attention, where the right vendors are coming from, and what is creating listing intent.
          </p>
        </div>

        <div className="-mx-5 overflow-hidden sm:-mx-6 lg:mx-0">
          <div className="flex w-max gap-5 px-5 pb-2 [animation:vendor-wins-scroll_32s_linear_infinite] hover:[animation-play-state:paused] sm:px-6 lg:px-0">
            {scrollingPanels.map((panel, index) => (
              <article key={`${panel.title}-${index}`} className="w-[78vw] shrink-0 overflow-hidden rounded-[18px] border border-black/10 bg-[#f6f4f8] shadow-[0_18px_50px_rgba(63,32,94,0.08)] sm:w-[430px] lg:w-[360px]">
                <div className="bg-[#8f33ff] px-3 py-3 text-center text-xs font-black text-white">
                  {panel.title}
                </div>
                <div className="bg-white p-2">
                  <img
                    src={panel.image}
                    alt={panel.alt}
                    className="aspect-[4/3] w-full rounded-[12px] object-contain"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
