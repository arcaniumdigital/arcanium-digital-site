import { ArrowRight, PhoneCall } from "lucide-react";

export function QuickCallSection() {
  return (
    <section id="quick-call" className="relative border-y border-foreground/10 bg-foreground/[0.025] py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:px-12">
        <div>
          <h2 className="max-w-3xl font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
            Want a quick call before the full strategy session?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Leave your name and mobile. We’ll personally give you a 5-minute call to see if an agent site makes sense before you commit to a longer meeting.
          </p>
        </div>

        <div className="border border-foreground/10 bg-background p-5 shadow-2xl shadow-foreground/5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#eca8d6] text-black">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-2xl">5-minute vendor call</h3>
              <p className="text-sm text-muted-foreground">A quick first step for agents who want more seller opportunities.</p>
            </div>
          </div>

          <p className="leading-relaxed text-muted-foreground">
            Start with the protected Vendor Conversion Audit form. Once your details are accepted, you can choose a time that suits you.
          </p>
          <a
            href="#cta"
            className="group mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#eca8d6] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#f1b7e0]"
          >
            Start my free vendor audit
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
