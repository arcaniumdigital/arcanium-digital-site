"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { VendorAuditForm } from "./vendor-audit-form";

const discoveryDescription = "Book your free 10-minute discovery call and receive our complimentary growth guide on running lead generation campaigns and utilising AI appointment setting and automated follow-up to turn more seller enquiries into booked appraisals.";

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
          <div data-audit-card className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f3f2ee] shadow-[0_42px_120px_rgba(0,0,0,0.32)] lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:rounded-[32px]">
            <div className="bg-white/55 px-1 py-2 sm:px-4 sm:py-5 lg:order-2 lg:grid lg:content-center lg:px-8 lg:py-10">
              <h2 className="mx-5 mb-6 mt-4 font-display text-[clamp(1.875rem,4vw,3.25rem)] font-semibold leading-[1] tracking-[-0.04em] text-[#101114] sm:mx-4 lg:hidden">
                Secure Your Next Appraisal
              </h2>
              <VendorAuditForm />
            </div>
            <div className="relative order-2 overflow-hidden border-t border-black/8 px-6 pb-7 pt-6 sm:px-8 lg:order-1 lg:border-r lg:border-t-0 lg:px-16 lg:py-16">
              <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-[#8f33ff]/10 blur-3xl" />
              <div className="relative">
                <h2 className="mb-6 hidden max-w-[620px] font-display text-[clamp(1.875rem,4vw,3.25rem)] font-semibold leading-[1] tracking-[-0.04em] text-[#101114] lg:block">
                  Secure Your Next Appraisal
                </h2>
                <div data-motion="guide" className="motion-guide overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_14px_35px_rgba(23,18,27,0.1)] lg:rounded-[16px] lg:shadow-[0_18px_45px_rgba(23,18,27,0.12)]">
                  <Image
                    src="/images/seller-pipeline/seller-appraisal-growth-plan-discovery.png"
                    alt="Complimentary Seller Appraisal Growth Guide covering Meta campaigns, AI response, seller nurture, appraisal booking and pipeline management."
                    width={1448}
                    height={1086}
                    sizes="(max-width: 1024px) 92vw, 470px"
                    quality={78}
                    className="h-auto w-full"
                    priority
                  />
                </div>

                <p className="mt-4 max-w-lg text-sm font-medium leading-[1.65] text-[#64656b] lg:hidden">
                  {discoveryDescription}
                </p>
              </div>
            </div>
          </div>
          <div data-audit-description className="mx-auto mt-9 hidden max-w-[940px] px-6 text-center lg:block">
            <p className="text-lg font-medium leading-[1.65] text-[#c5c5cc]">{discoveryDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
