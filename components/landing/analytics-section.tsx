import { BarChart3, LineChart, MousePointerClick, PieChart } from "lucide-react";

const panels = [
  {
    title: "Lead source report",
    eyebrow: "Source tracking",
    metric: "38 leads",
    icon: BarChart3,
    kind: "bars",
    caption: "See whether enquiries came from Google, Instagram, referrals, or campaign links.",
  },
  {
    title: "Suburb intent map",
    eyebrow: "Local demand",
    metric: "12 suburbs",
    icon: PieChart,
    kind: "heatmap",
    caption: "Identify which local pages are creating the most seller interest.",
  },
  {
    title: "CTA performance",
    eyebrow: "Conversion clicks",
    metric: "14.8%",
    icon: MousePointerClick,
    kind: "steps",
    caption: "Track which prompts move visitors toward a booked appraisal growth call or appraisal enquiry.",
  },
  {
    title: "Booked-call trend",
    eyebrow: "Calendar growth",
    metric: "+31%",
    icon: LineChart,
    kind: "line",
    caption: "Measure how the site turns proof, traffic, and seller tools into booked conversations.",
  },
];

function AnalyticsImage({ panel }: { panel: (typeof panels)[number] }) {
  return (
    <article className="group overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
      <div className="relative aspect-[4/3] overflow-hidden bg-black p-5 text-white">
        <div className="absolute inset-0 opacity-25">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
        </div>
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                {panel.eyebrow}
              </span>
              <h3 className="mt-2 font-display text-2xl">{panel.title}</h3>
            </div>
            <panel.icon className="size-5 text-[#eca8d6]" />
          </div>

          <strong className="font-display text-5xl font-normal">{panel.metric}</strong>

          <div className="mt-auto">
            {panel.kind === "bars" && (
              <div className="grid h-32 grid-cols-5 items-end gap-2">
                {[44, 72, 58, 90, 64].map((height, barIndex) => (
                  <span
                    key={height}
                    className="bg-[#eca8d6]"
                    style={{ height: `${height}%`, opacity: 0.38 + barIndex * 0.1 }}
                  />
                ))}
              </div>
            )}

            {panel.kind === "heatmap" && (
              <div className="grid grid-cols-4 gap-2">
                {[35, 60, 95, 45, 70, 40, 82, 55, 48, 88, 63, 30].map((alpha) => (
                  <span
                    key={alpha}
                    className="aspect-square bg-[#eca8d6]"
                    style={{ opacity: alpha / 100 }}
                  />
                ))}
              </div>
            )}

            {panel.kind === "steps" && (
              <div className="space-y-3">
                {["Hero CTA", "Site showcase", "Calendar booking"].map((label, stepIndex) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs text-white/45">
                      <span>{label}</span>
                      <span>{[18, 24, 31][stepIndex]}%</span>
                    </div>
                    <div className="h-2 bg-white/10">
                      <div
                        className="h-full bg-[#eca8d6]"
                        style={{ width: `${[52, 68, 86][stepIndex]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {panel.kind === "line" && (
              <div className="relative h-32">
                <svg viewBox="0 0 300 130" className="h-full w-full overflow-visible">
                  <path
                    d="M5 104 C45 90, 62 98, 92 74 S145 58, 178 44 S235 42, 295 16"
                    fill="none"
                    stroke="#eca8d6"
                    strokeWidth="4"
                  />
                  {[5, 92, 178, 295].map((cx, dotIndex) => (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={[104, 74, 44, 16][dotIndex]}
                      r="5"
                      fill="#eca8d6"
                    />
                  ))}
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">
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
              Four views of
              <br />
              <span className="text-muted-foreground">seller intent.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5">
            See which channels, suburbs, and calls-to-action are creating real seller intent, then improve the site around what gets booked.
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
