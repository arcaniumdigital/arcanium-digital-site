"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { FunnelProgress } from "./funnel-progress";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-4 top-4 z-50 lg:inset-x-8">
      <nav className={`mx-auto flex h-[62px] max-w-[1200px] items-center justify-between rounded-[14px] px-3 transition-[background-color,box-shadow] duration-300 lg:px-4 ${isScrolled ? "bg-[#0b0c0e]/95 shadow-[0_18px_48px_rgba(0,0,0,.22)]" : "bg-[#0b0c0e]/82"}`}>
        <a href="#" className="flex min-h-11 items-center rounded-[10px] px-1" aria-label="Arcanium Digital">
          <Image src="/images/brand/logo-ad.png" alt="Arcanium Digital" width={38} height={38} sizes="38px" className="size-[38px] scale-[1.45] object-contain mix-blend-screen" />
        </a>
        <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - header" className="group inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#f4f3ef] px-4 text-sm font-semibold text-[#121311] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white">
          Book a discovery call
          <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </MetaTrackedLink>
      </nav>
      <FunnelProgress />
    </header>
  );
}
