"use client";

import Script from "next/script";
import { WistiaPlayTracker } from "@/components/analytics/wistia-play-tracker";

const mediaId = "nswzcixdnm";

export function AuditReminderVideo() {
  return (
    <div className="aspect-video overflow-hidden rounded-[15px] bg-black sm:rounded-[18px]">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src={`https://fast.wistia.com/embed/${mediaId}.js`}
        strategy="afterInteractive"
        type="module"
      />
      <style jsx global>{`
        .audit-reminder-video wistia-player[media-id="${mediaId}"] {
          display: block;
          height: 100%;
          width: 100%;
        }
        .audit-reminder-video wistia-player[media-id="${mediaId}"]:not(:defined) {
          background: center / contain no-repeat url("https://fast.wistia.com/embed/medias/${mediaId}/swatch");
          display: block;
          filter: blur(5px);
          padding-top: 56.25%;
        }
      `}</style>
      <div
        className="audit-reminder-video h-full w-full"
        dangerouslySetInnerHTML={{
          __html: `<wistia-player media-id="${mediaId}" aspect="1.7777777777777777" player-color="#8f33ff" autoplay silent-autoplay="allow" volume="1"></wistia-player>`,
        }}
      />
      <WistiaPlayTracker mediaId={mediaId} placement="Audit reminder page" />
    </div>
  );
}
