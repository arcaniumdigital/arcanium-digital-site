import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="bg-black px-6 py-20 text-white lg:px-12 lg:py-28">
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <div>
          <h2 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Stop sending warm seller attention to a dead end.
          </h2>
        </div>
        <a
          href="#cta"
          className="group inline-flex h-14 shrink-0 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-colors hover:bg-white/90"
        >
          Show me how
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
