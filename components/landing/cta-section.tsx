"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "magnet" });

      cal("ui", {
        theme: "dark",
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#f68dff",
          },
          dark: {
            "cal-brand": "#f68dff",
          },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <section id="cta" ref={sectionRef} className="relative overflow-hidden py-16 lg:py-20">
      <div className="mx-auto max-w-[1120px] px-6 lg:px-12">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-7 text-center">
            <span className="mb-4 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-10 bg-foreground/30" />
              Book the appraisal growth call
              <span className="h-px w-10 bg-foreground/30" />
            </span>
            <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              See how your site could win more seller conversations.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Pick a time and we will map the fastest path from your existing proof to a site sellers can trust, remember, and book through.
            </p>
          </div>

          <div className="mx-auto max-w-5xl overflow-hidden border border-foreground/15 bg-[#0b0b0c] shadow-2xl shadow-foreground/5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-3 lg:px-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">
                  Arcanium Digital / appraisal growth
                </span>
                <h3 className="font-display text-2xl text-white">Choose a time to map your appraisal funnel</h3>
              </div>
              <CalendarDays className="hidden size-6 text-[#f68dff] sm:block" />
            </div>

            <div className="h-[545px] bg-[#0b0b0c]">
              <Cal
                namespace="magnet"
                calLink="arcaniumdigital/magnet"
                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                config={{
                  layout: "month_view",
                  useSlotsViewOnSmallScreen: "true",
                  theme: "dark",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
