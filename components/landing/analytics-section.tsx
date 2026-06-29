const panels = [
  {
    title: "May Growth Analytics",
    image: "/images/analytics/traffic-overview.jpg",
    alt: "Analytics dashboard showing visitors, pageviews, bounce rate, session duration, sources, and top pages",
  },
  {
    title: "June Growth Analytics",
    image: "/images/analytics/traffic-trend.jpg",
    alt: "Analytics dashboard showing a monthly visitor and pageview trend",
  },
  {
    title: "May Audience Report",
    image: "/images/analytics/audience-tracking.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked seller actions",
  },
  {
    title: "June Audience Report",
    image: "/images/analytics/audience-growth.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked conversion events",
  },
];

function AnalyticsImage({ panel }: { panel: (typeof panels)[number] }) {
  return (
    <article className="group overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img
          src={panel.image}
          alt={panel.alt}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.015]"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl">{panel.title}</h3>
      </div>
    </article>
  );
}

export function AnalyticsSection() {
  return (
    <section id="analytics" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Know what is
              <br />
              <span className="text-muted-foreground">creating intent.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5">
            Once the site is live, you should know where sellers came from, what they looked at, and which actions are moving them closer to an appraisal conversation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {panels.map((panel) => (
            <AnalyticsImage key={panel.title} panel={panel} />
          ))}
        </div>
      </div>
    </section>
  );
}
