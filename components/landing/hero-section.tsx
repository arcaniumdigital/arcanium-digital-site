"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

function HeroVideo() {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="group relative overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-2xl shadow-[#eca8d6]/10">
        <div className="relative aspect-[4/3] bg-black sm:aspect-[16/9]">
          <div
            className="hero-wistia-player h-full w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<wistia-player media-id="43wdr7dw38" wistia-popover="true" aspect="1.3333333333333333"></wistia-player>',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
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
    <section className="relative overflow-hidden bg-black px-6 pb-16 pt-28 text-white md:pb-20 md:pt-28 lg:min-h-[100svh] lg:px-12 lg:pt-28">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/43wdr7dw38.js"
        strategy="afterInteractive"
        type="module"
      />
      <style jsx global>{`
        .hero-wistia-player wistia-player[media-id="43wdr7dw38"] {
          display: block;
          height: 100%;
          width: 100%;
        }

        .hero-wistia-player wistia-player[media-id="43wdr7dw38"]:not(:defined) {
          background: center / cover no-repeat url("https://fast.wistia.com/embed/medias/43wdr7dw38/swatch");
          display: block;
          height: 100%;
          width: 100%;
        }
      `}</style>

      <div
        className={`mx-auto flex max-w-[1200px] flex-col items-center text-center transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <h1 className="max-w-[1300px] font-display text-[clamp(3rem,7vw,6.4rem)] font-semibold leading-[0.9] tracking-tight text-white">
          Want more appraisals?
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/64 md:text-xl">
          We build personal agent sites that turn your reviews, recent sales, local proof, and social attention into booked seller conversations.
        </p>

        <div className="mt-10 w-full md:mt-12">
          <HeroVideo />
        </div>

        <a
          href="#cta"
          className="group mt-7 inline-flex h-14 items-center justify-center rounded-full bg-[#eca8d6] px-8 text-sm font-semibold text-black shadow-xl shadow-[#eca8d6]/25 transition-colors hover:bg-[#f1b7e0] md:px-10"
        >
          I want more appraisals
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
