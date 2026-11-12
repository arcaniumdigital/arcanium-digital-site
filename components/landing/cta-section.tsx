"use client";

import Image from "next/image";
import { VendorAuditForm } from "./vendor-audit-form";

export function CtaSection() {
  return (
    <section id="audit" className="relative scroll-mt-24 bg-[#0a0b0d] px-4 pb-24 pt-2 md:px-8 lg:scroll-mt-28 lg:px-12 lg:pb-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="overflow-hidden rounded-[18px] bg-[#f1f0eb] lg:grid lg:grid-cols-2">
          <div className="grid content-center px-6 py-12 sm:px-10 lg:order-2 lg:px-14 lg:py-16">
            <p className="mb-3 text-sm font-semibold text-[#6b6d68]">A focused 10-minute conversation</p>
            <h2 className="max-w-[520px] font-display text-[clamp(2.25rem,4vw,3.6rem)] font-medium leading-[.98] tracking-[-0.04em] text-[#151613]">
              See what this could look like in your market.
            </h2>
            <p className="mt-5 max-w-[520px] text-base leading-[1.65] text-[#62645f]">Share your details and choose a time. We&apos;ll map the simplest path from seller enquiry to appraisal for your agency.</p>
            <VendorAuditForm />
          </div>
          <div className="relative min-h-[360px] overflow-hidden bg-[#deded8] lg:order-1 lg:min-h-[680px]">
            <Image src="/images/seller-pipeline/service-overview.png" alt="Seller appraisal growth system overview" fill sizes="(max-width: 1024px) 100vw, 600px" quality={82} className="object-cover" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
