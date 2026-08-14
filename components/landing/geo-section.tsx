const signals = [
  "Who you are",
  "Which suburbs you specialise in",
  "Your sales history and experience",
  "Your reviews and reputation",
  "What makes you relevant to local vendors",
];

export function GeoSection() {
  return (
    <section className="relative overflow-hidden bg-[#08090c] px-5 py-[88px] text-[#f5f5f3] [content-visibility:auto] [contain-intrinsic-size:auto_1300px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="pointer-events-none absolute -left-52 top-1/3 size-[620px] rounded-full bg-[#8f33ff]/7 blur-[160px]" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#aaaab2]"><span className="size-1.5 rounded-full bg-[#8f33ff]" />Generative Engine Optimisation</p>
            <h2 className="mt-5 max-w-[690px] font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[clamp(3rem,4vw,4.25rem)]">The Best Agent Doesn’t Always Get Found First</h2>
            <p className="mt-5 max-w-[650px] text-base font-medium leading-[1.65] text-[#aaaab2] lg:mt-6 lg:text-lg">When a vendor asks ChatGPT, “Who are the best real estate agents in their suburb?”, AI needs enough evidence online to understand who you are, where you operate and why you’re relevant.</p>
            <p className="mt-4 max-w-[650px] text-base font-medium leading-[1.65] text-[#aaaab2] lg:text-lg">That’s Generative Engine Optimisation (GEO). We strengthen the website, content, profiles and authority signals that help Google and AI understand:</p>
          </div>

          <div className="relative space-y-6 pl-10 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:w-px before:bg-gradient-to-b before:from-[#8f33ff] before:to-[#8f33ff]/15 lg:col-span-6 lg:col-start-7 lg:space-y-8 lg:pl-0 lg:before:left-1/2">
            {signals.map((label, index) => (
              <div key={label} className={`relative lg:flex ${index % 2 ? "lg:justify-end" : "lg:justify-start"}`}>
                <span className="absolute -left-[37px] top-1.5 size-3 rounded-full border-[3px] border-[#08090c] bg-[#8f33ff] ring-1 ring-[#8f33ff]/45 lg:left-1/2 lg:-translate-x-1/2" />
                <p className="max-w-[260px] font-display text-lg font-medium leading-snug tracking-[-0.02em] text-[#f5f5f3] lg:w-[44%] lg:max-w-none lg:text-xl">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 border-t border-white/9 lg:mt-32">
          {["THEY GET FOUND FIRST.", "THEY GET CONSIDERED FIRST.", "THEY GET THE OPPORTUNITY FIRST."].map((line) => (
            <div key={line} className="border-b border-white/9 py-7 font-display text-[clamp(1.75rem,8vw,2.125rem)] font-semibold leading-[1.05] tracking-[-0.04em] lg:py-10 lg:text-[clamp(2.125rem,4vw,3.75rem)]">{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
