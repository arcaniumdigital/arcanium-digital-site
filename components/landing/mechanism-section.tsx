const layers = [
  "Position the agent around a local seller market",
  "Showcase sales, testimonials, and suburb expertise",
  "Add appraisal, home value, and audit conversion paths",
  "Build SEO pages for high-intent local searches",
  "Track enquiries and refine the funnel",
];

export function MechanismSection() {
  return (
    <section id="system" className="relative overflow-hidden bg-black py-24 text-white lg:py-32">
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Most agent sites are
            <br />
            <span className="text-white/40">online brochures.</span>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/60">
            Arcanium Digital turns the brochure into a trust path: local positioning, visible proof, seller tools, and clear enquiry points that make choosing you easier.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="grid gap-3">
            {layers.map((layer, index) => (
              <div key={layer} className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border border-white/12 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
                <span className="font-mono text-sm text-[#eca8d6]">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-display text-2xl">{layer}</span>
                <span className="h-px w-12 bg-white/20 transition-all group-hover:w-20 group-hover:bg-[#eca8d6]" />
              </div>
            ))}
          </div>

          <div className="mt-6 border border-white/12 bg-white/[0.03] p-6">
            <p className="font-mono text-sm leading-relaxed text-white/55">
              visitor -&gt; local proof -&gt; seller tool -&gt; appraisal enquiry -&gt; listing conversation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
