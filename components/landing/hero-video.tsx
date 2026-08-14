"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

export function HeroVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[920px]">
      <div className="pointer-events-none absolute inset-0 translate-x-[12px] translate-y-[14px] rounded-[18px] border border-[#8f33ff]/18 bg-[#131419] lg:translate-x-[18px] lg:translate-y-5 lg:rounded-[24px]" />
      <div className="group relative overflow-hidden rounded-[18px] border border-white/12 bg-[#0d0e12] shadow-[0_28px_70px_rgba(0,0,0,0.38)] transition-transform duration-500 lg:rounded-[24px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[8/5] overflow-hidden bg-black">
          {isPlaying ? (
            <>
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
              `}</style>
              <div
                className="hero-wistia-player h-full w-full"
                dangerouslySetInnerHTML={{
                  __html:
                    '<wistia-player media-id="rdnom0qfs9" aspect="1.7777777777777777" player-color="#8f33ff" autoplay volume="1"></wistia-player>',
                }}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackMetaCustomEvent("VideoPlay", {
                  video_id: "rdnom0qfs9",
                  placement: "Homepage hero",
                });
                setIsPlaying(true);
              }}
              className="absolute inset-0 block h-full w-full cursor-pointer bg-black text-white"
              aria-label="Play the vendor audit video"
            >
              <Image
                src="/images/video/vendor-audit-poster.jpg"
                alt=""
                fill
                preload
                quality={76}
                sizes="(max-width: 960px) calc(100vw - 40px), 920px"
                className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.015]"
              />
              <span className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/10" />
              <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 shadow-[0_16px_38px_rgba(0,0,0,0.4)] backdrop-blur-md transition-transform duration-[400ms] group-hover:scale-[1.04] sm:size-16">
                <Play className="ml-1 size-6 fill-current sm:size-7" aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
