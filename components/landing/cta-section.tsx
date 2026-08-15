"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { VendorAuditForm } from "./vendor-audit-form";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section id="audit" ref={sectionRef} className="relative scroll-mt-24 bg-[#0d0e12] px-3 py-20 sm:px-4 md:px-8 lg:scroll-mt-[200px] lg:px-12 lg:pb-6 lg:pt-0">
      <div className="mx-auto max-w-[1280px] lg:-translate-y-24">
        <div className={`transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f3f2ee] shadow-[0_42px_120px_rgba(0,0,0,0.32)] lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:rounded-[32px]">
            <div className="relative overflow-hidden border-b border-black/8 px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-16 lg:py-16">
              <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-[#8f33ff]/10 blur-3xl" />
              <div className="relative">
                <h2 className="max-w-[620px] font-display text-[clamp(2rem,8.8vw,2.25rem)] font-semibold leading-[1] tracking-[-0.04em] text-[#101114] lg:text-[clamp(2.625rem,4vw,3.25rem)]">
                  Become the Agent Everyone Finds First
                </h2>
                <p className="mt-5 max-w-lg text-base font-medium leading-[1.65] text-[#64656b] lg:text-lg">
                  Enter your details below to unlock your Suburb Visibility Audit.
                </p>
              </div>
            </div>
            <div className="bg-white/55 px-1 py-2 sm:px-4 sm:py-5 lg:grid lg:content-center lg:px-8 lg:py-10">
              <div className="px-5 pt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#7b25e8] sm:px-8 sm:pt-6">
                Your free Suburb Visibility Audit
              </div>
              <VendorAuditForm />
              <div className="mx-auto -mt-2 mb-5 max-w-[600px] px-5 pb-2 sm:-mt-3 sm:mb-6 sm:px-8">
                <div className="flex gap-3.5 rounded-[14px] border border-black/10 bg-white/70 p-4 text-left shadow-[0_8px_24px_rgba(16,17,20,0.05)] sm:p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[#8f33ff]/20 bg-[#8f33ff]/8 text-[#7b25e8]">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold tracking-[-0.025em] text-[#101114] sm:text-lg">
                      Our 90-Day Visibility Guarantee
                    </h3>
                    <p className="mt-1.5 text-[13px] font-semibold leading-[1.55] text-[#55565d] sm:text-sm">
                      If we cannot demonstrate clear improvement across your priority Google and AI searches within 90 days, we keep working at no service fee until we can.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
