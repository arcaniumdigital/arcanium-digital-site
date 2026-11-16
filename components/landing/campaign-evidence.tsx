"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

export function CampaignEvidence() {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const phone = matchMedia("(max-width: 767px)");
    const focusResults = () => {
      const element = viewport.current;
      if (element) element.scrollLeft = phone.matches ? element.scrollWidth * 0.455 : 0;
    };
    focusResults();
    phone.addEventListener("change", focusResults);
    return () => phone.removeEventListener("change", focusResults);
  }, []);
  return <figure className="mv-campaign-evidence">
    <div ref={viewport} className="mv-campaign-viewport" role="region" aria-label="Meta campaign results screenshot. Scroll horizontally to inspect the columns." tabIndex={0}>
      <Image src="/images/seller-pipeline/meta-dashboard-two-weeks.png" alt="Meta Ads Manager: 16 form leads across three ad sets and $243.05 total spend, 28 October to 10 November 2026." width={2792} height={986} sizes="(max-width: 767px) 963px, 1040px" draggable={false} unoptimized />
    </div>
    <figcaption>Swipe to view all campaign columns.</figcaption>
  </figure>;
}
