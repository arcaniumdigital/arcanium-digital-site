const panels = [
  {
    title: "Traffic growth snapshot",
    eyebrow: "Last 30 days",
    image: "/images/analytics/traffic-overview.jpg",
    alt: "Analytics dashboard showing visitors, pageviews, bounce rate, session duration, sources, and top pages",
    caption: "Show agents where attention is coming from, which pages sellers read, and whether the site is creating more appraisal intent.",
  },
  {
    title: "Monthly performance trend",
    eyebrow: "Momentum",
    image: "/images/analytics/traffic-trend.jpg",
    alt: "Analytics dashboard showing a monthly visitor and pageview trend",
    caption: "Track whether the site is gaining traction month to month, not just looking good on launch day.",
  },
  {
    title: "Audience and action report",
    eyebrow: "Seller behaviour",
    image: "/images/analytics/audience-tracking.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked seller actions",
    caption: "See which devices, locations, and calls-to-action are turning quiet visitors into measurable seller actions.",
  },
  {
    title: "Conversion event detail",
    eyebrow: "Action tracking",
    image: "/images/analytics/audience-growth.jpg",
    alt: "Analytics dashboard showing geography, devices, and tracked conversion events",
    caption: "Break down phone taps, forms, appraisal requests, listing enquiries, and other actions that show seller intent.",
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
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {panel.eyebrow}
        </span>
        <h3 className="mt-2 font-display text-2xl">{panel.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{panel.caption}</p>
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
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-10 bg-foreground/30" />
              Data and analytics
            </span>
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
