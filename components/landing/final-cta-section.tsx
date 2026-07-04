import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="bg-[#f6f4f8] px-5 py-20 text-[#111114] sm:px-6 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[980px] text-center">
        <h2 className="font-display text-[clamp(2.4rem,5.4vw,5.2rem)] font-black leading-[0.92] tracking-tight">
          Ready to turn local attention into endless vendors?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-[#111114]/58 md:text-lg">
          Book the call, we will map the funnel, and you will see exactly what your personal agent site should say, show, and track to create more listing intent.
        </p>
        <a
          href="#cta"
          className="group mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#8f33ff] px-8 text-sm font-black text-white shadow-[0_16px_42px_rgba(143,51,255,0.32)] transition-colors hover:bg-[#7b25e8]"
        >
          Show me how
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
