import { Play, Quote } from "lucide-react";

export function VideoTestimonialSection() {
  return (
    <section id="video-testimonial" className="relative overflow-hidden bg-black py-24 text-white lg:py-32">
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1400px] gap-10 px-6 lg:grid-cols-12 lg:items-center lg:px-12">
        <div className="lg:col-span-5">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-white/45">
            <span className="h-px w-10 bg-white/25" />
            Video testimonial
          </span>
          <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Hear it from
            <br />
            <span className="text-white/35">an agent.</span>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/60">
            Add a short client story here that shows the before, the new site, and the seller conversations it helped create.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="group relative aspect-video overflow-hidden border border-white/15 bg-white/[0.03]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(236,168,214,0.28),transparent_30%),radial-gradient(circle_at_74%_68%,rgba(103,232,249,0.18),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
            <div className="absolute inset-0 bg-black/35" />

            <div className="absolute left-5 right-5 top-5 flex items-center justify-between font-mono text-xs text-white/50">
              <span>CLIENT STORY</span>
              <span>02:18</span>
            </div>

            <button
              type="button"
              className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white text-black transition-transform group-hover:scale-105"
              aria-label="Play video testimonial"
            >
              <Play className="ml-1 size-8 fill-black" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/60 p-6 backdrop-blur-md">
              <Quote className="mb-4 size-5 text-[#eca8d6]" />
              <p className="max-w-2xl font-display text-2xl leading-tight">
                The site finally gave sellers one place to understand my market, my results, and why to book an appraisal with me.
              </p>
              <p className="mt-4 text-sm text-white/45">Sample quote - replace with real client video proof</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
