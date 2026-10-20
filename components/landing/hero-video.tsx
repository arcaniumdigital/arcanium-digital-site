"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { WistiaPlayTracker } from "@/components/analytics/wistia-play-tracker";

interface HeroPlayer extends HTMLElement {
  muted: boolean;
  volume: number;
  currentTime: number;
  play: () => Promise<void> | void;
}

// Keep this prop stable so audio state updates never recreate the live player.
const HERO_EMBED = {
  __html: '<wistia-player media-id="rdnom0qfs9" aspect="1.7777777777777777" player-color="#8f33ff" autoplay silent-autoplay="allow" volume="1"></wistia-player>',
};

export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canEnableSound, setCanEnableSound] = useState(false);
  const [isSilent, setIsSilent] = useState(true);

  useEffect(() => {
    const player = containerRef.current?.querySelector<HeroPlayer>("wistia-player");
    if (!player) return;
    let disposed = false;
    const syncSound = () => setIsSilent(player.muted || player.volume === 0);
    const ready = () => {
      if (disposed || typeof player.play !== "function") return;
      setCanEnableSound(true);
      syncSound();
    };
    const silentPlaybackChanged = (event: Event) => {
      const { isInSilentPlaybackMode } = (event as CustomEvent<{ isInSilentPlaybackMode: boolean }>).detail;
      setIsSilent(isInSilentPlaybackMode || player.muted || player.volume === 0);
    };
    player.addEventListener("api-ready", ready);
    player.addEventListener("can-play", ready);
    player.addEventListener("play", ready);
    player.addEventListener("mute-change", syncSound);
    player.addEventListener("volume-change", syncSound);
    player.addEventListener("silent-playback-mode-change", silentPlaybackChanged);
    void customElements.whenDefined("wistia-player").then(ready);
    return () => {
      disposed = true;
      player.removeEventListener("api-ready", ready);
      player.removeEventListener("can-play", ready);
      player.removeEventListener("play", ready);
      player.removeEventListener("mute-change", syncSound);
      player.removeEventListener("volume-change", syncSound);
      player.removeEventListener("silent-playback-mode-change", silentPlaybackChanged);
    };
  }, []);

  const enableSound = () => {
    const player = containerRef.current?.querySelector<HeroPlayer>("wistia-player");
    if (!player || typeof player.play !== "function") return;
    // Keep these calls synchronous inside the tap for iPhone's media policy.
    player.currentTime = 0;
    player.volume = 1;
    player.muted = false;
    const playback = player.play();
    if (playback instanceof Promise) {
      void playback.catch(() => setIsSilent(true));
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-[920px]">
      <div className="pointer-events-none absolute inset-0 translate-x-[12px] translate-y-[14px] rounded-[18px] border border-[#8f33ff]/18 bg-[#131419] lg:translate-x-[18px] lg:translate-y-5 lg:rounded-[24px]" />
      <div className="group relative overflow-hidden rounded-[18px] border border-white/12 bg-[#0d0e12] shadow-[0_28px_70px_rgba(0,0,0,0.38)] transition-transform duration-500 lg:rounded-[24px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[8/5] overflow-hidden bg-black">
          <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
          <Script
            src="https://fast.wistia.com/embed/rdnom0qfs9.js"
            strategy="afterInteractive"
            type="module"
          />
          {canEnableSound && isSilent && <button type="button" onClick={enableSound} className="hero-sound-button" aria-label="Watch the video from the beginning with sound">
            <Volume2 size={18} aria-hidden="true" /><span>Tap for sound</span>
          </button>}
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
            dangerouslySetInnerHTML={HERO_EMBED}
          />
          <WistiaPlayTracker mediaId="rdnom0qfs9" placement="Homepage hero" />
        </div>
      </div>
    </div>
  );
}
