"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-3 top-3 z-50 sm:inset-x-4 lg:inset-x-8 lg:top-5">
      <nav
        className={`mx-auto flex h-[60px] max-w-[1280px] items-center justify-between rounded-[16px] border px-2.5 backdrop-blur-[16px] transition-all duration-500 sm:px-3 lg:h-[72px] lg:rounded-[18px] lg:px-4 ${
          isScrolled
            ? "border-white/10 bg-[#08090c]/85 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
            : "border-white/8 bg-[#08090c]/45 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        }`}
      >
        <a href="#" className="flex min-h-11 items-center gap-2 rounded-[12px] px-1.5" aria-label="Arcanium Digital">
          <span className="grid size-10 place-items-center overflow-hidden rounded-[12px] bg-[#131419] p-1.5 ring-1 ring-white/10">
            <Image
              src="/images/brand/logo-ad.png"
              alt="Arcanium Digital"
              width={40}
              height={40}
              sizes="40px"
              className="h-full w-full scale-[1.5] object-contain mix-blend-screen"
            />
          </span>
        </a>

        <MetaTrackedLink
          href="#audit"
          trackingLabel="Check my online visibility - header"
          className="group inline-flex min-h-11 items-center justify-center rounded-[12px] border border-white/15 bg-[#f4f4f2] px-3 text-[0.68rem] font-bold tracking-[-0.01em] text-[#0b0c0f] transition duration-300 hover:-translate-y-px hover:bg-white sm:px-4 sm:text-xs lg:h-[46px] lg:px-5 lg:text-sm"
        >
          CHECK MY ONLINE VISIBILITY
          <ArrowRight className="ml-1.5 size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 lg:size-4" aria-hidden="true" />
        </MetaTrackedLink>
      </nav>
    </header>
  );
}
