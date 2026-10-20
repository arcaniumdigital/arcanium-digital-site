"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
        <div className={`transition-transform duration-700 ${isVisible ? "translate-y-0" : "translate-y-2"}`}>
          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f3f2ee] shadow-[0_42px_120px_rgba(0,0,0,0.32)] lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:rounded-[32px]">
            <div className="bg-white/55 px-1 py-2 sm:px-4 sm:py-5 lg:order-2 lg:grid lg:content-center lg:px-8 lg:py-10">
              <div className="px-5 pt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#7b25e8] sm:px-8 sm:pt-6">
                Free Growth Plan + Strategy Call
              </div>
              <VendorAuditForm />
            </div>
            <div className="relative order-2 overflow-hidden border-t border-black/8 px-6 pb-7 pt-6 sm:px-8 lg:order-1 lg:border-r lg:border-t-0 lg:px-16 lg:py-16">
              <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-[#8f33ff]/10 blur-3xl" />
              <div className="relative">
                <h2 className="hidden max-w-[620px] font-display text-[clamp(2.625rem,4vw,3.25rem)] font-semibold leading-[1] tracking-[-0.04em] text-[#101114] lg:block">
                  Get Your Seller Appraisal Growth Plan
                </h2>
                <p className="max-w-lg text-sm font-medium leading-[1.65] text-[#64656b] lg:mt-5 lg:text-lg">
                  Get the five-step blueprint, then book a free 10–15 minute strategy call to identify the best next steps for your business.
                </p>
                <div data-motion="guide" className="motion-guide mt-5 overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_14px_35px_rgba(23,18,27,0.1)] lg:mt-7 lg:rounded-[16px] lg:shadow-[0_18px_45px_rgba(23,18,27,0.12)]">
                  <Image
                    src="/images/seller-pipeline/seller-appraisal-growth-plan.png"
                    alt="Your Seller Appraisal Growth Plan, an eight-page guide covering Meta campaigns, AI response, seller nurture, appraisal booking and pipeline management."
                    width={1536}
                    height={1024}
                    sizes="(max-width: 1024px) 92vw, 470px"
                    quality={78}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
