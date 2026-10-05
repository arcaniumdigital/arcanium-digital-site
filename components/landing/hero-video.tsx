"use client";

import Script from "next/script";
import { WistiaPlayTracker } from "@/components/analytics/wistia-play-tracker";

export function HeroVideo() {
  return (
    <div className="relative mx-auto w-full max-w-[920px]">
      <div className="pointer-events-none absolute inset-0 translate-x-[12px] translate-y-[14px] rounded-[18px] border border-[#8f33ff]/18 bg-[#131419] lg:translate-x-[18px] lg:translate-y-5 lg:rounded-[24px]" />
      <div className="group relative overflow-hidden rounded-[18px] border border-white/12 bg-[#0d0e12] shadow-[0_28px_70px_rgba(0,0,0,0.38)] transition-transform duration-500 lg:rounded-[24px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[8/5] overflow-hidden bg-black">
          <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
          <Script
            src="https://fast.wistia.com/embed/rdnom0qfs9.js"
            strategy="afterInteractive"
            type="module"
          />
          <style jsx global>{`
            .hero-wistia-player wistia-player[media-id="rdnom0qfs9"] {
              display: block;
              height: 100%;
              width: 100%;
            }
            .hero-wistia-player wistia-player:not(:defined) {
              background: center / contain no-repeat
                url("https://fast.wistia.com/embed/medias/rdnom0qfs9/swatch");
            }
          `}</style>
          <div
            className="hero-wistia-player h-full w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<wistia-player media-id="rdnom0qfs9" aspect="1.7777777777777777" player-color="#8f33ff" autoplay silent-autoplay="allow" volume="1"></wistia-player>',
            }}
          />
          <WistiaPlayTracker mediaId="rdnom0qfs9" placement="Homepage hero" />
        </div>
      </div>
    </div>
  );
}
