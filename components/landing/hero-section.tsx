"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

function HeroVideo() {
  return (
    <div className="mx-auto w-full max-w-[920px]">
      <div className="group relative overflow-hidden rounded-[18px] border border-black/10 bg-white p-2 shadow-[0_34px_90px_rgba(63,32,94,0.18)]">
        <div className="relative aspect-video overflow-hidden rounded-[12px] bg-black">
          <div
            className="hero-wistia-player h-full w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<wistia-player media-id="46st4epgrb" aspect="1.7777777777777777" player-color="#8f33ff" autoplay silent-autoplay="allow" volume="1"></wistia-player>',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/0" />
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="vsl" className="relative overflow-hidden bg-[#f6f4f8] px-5 pb-12 pt-24 text-[#111114] sm:px-6 md:pb-16 md:pt-28 lg:px-12">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/46st4epgrb.js"
        strategy="afterInteractive"
        type="module"
      />
      <style jsx global>{`
        .hero-wistia-player wistia-player[media-id="46st4epgrb"] {
          display: block;
          height: 100%;
          width: 100%;
        }

        .hero-wistia-player wistia-player[media-id="46st4epgrb"]:not(:defined) {
          background: center / contain no-repeat url("https://fast.wistia.com/embed/medias/46st4epgrb/swatch");
          display: block;
          filter: blur(5px);
          height: 100%;
          width: 100%;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#8f33ff_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f6f4f8]" />

      <div
        className={`relative mx-auto flex max-w-[1180px] flex-col items-center text-center transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <h1 className="max-w-[1050px] font-display text-[clamp(2.65rem,6.8vw,6.45rem)] font-black leading-[0.9] tracking-tight text-[#111114]">
          How local agents turn their personal brand into{" "}
          <span className="text-[#8f33ff]">endless vendors.</span>
        </h1>

        <p className="mt-6 max-w-[720px] text-base font-medium leading-relaxed text-[#111114]/58 md:text-xl">
          Before they book an appraisal, vendors are checking your proof, your results, and whether you feel like the safe choice. Find the gaps that may be costing you listing conversations.
        </p>

        <div className="mt-9 w-full md:mt-11">
          <HeroVideo />
        </div>

        <a
          href="#audit"
          className="group mt-7 inline-flex h-14 items-center justify-center rounded-full bg-[#8f33ff] px-8 text-sm font-black text-white shadow-[0_16px_42px_rgba(143,51,255,0.32)] transition-colors hover:bg-[#7b25e8] md:px-10"
        >
          Get my free vendor opportunity audit
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
