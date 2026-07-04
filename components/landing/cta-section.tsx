"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useRef, useState } from "react";

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
        theme: "light",
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#8f33ff",
          },
          dark: {
            "cal-brand": "#8f33ff",
          },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <section id="cta" ref={sectionRef} className="relative overflow-hidden bg-[#f6f4f8] px-5 pb-16 pt-4 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-[1080px]">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="mx-auto mb-6 max-w-[760px] text-center font-display text-[clamp(2.4rem,5vw,4.8rem)] font-black leading-[0.92] tracking-tight text-[#111114]">
            Apply for your appraisal growth plan below
          </h2>

          <div className="mx-auto overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(63,32,94,0.14)]">
            <div className="bg-[#8f33ff] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
              Pick a time and we will map your seller funnel
            </div>
            <div className="h-[540px] bg-white">
              <Cal
                namespace="magnet"
                calLink="arcaniumdigital/magnet"
                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                config={{
                  layout: "month_view",
                  useSlotsViewOnSmallScreen: "true",
                  theme: "light",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
