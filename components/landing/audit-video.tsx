"use client";

import { useRef } from "react";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

const mediaId = "l33mw4dw0k";

export function AuditVideo() {
  const tracked = useRef(false);

  return (
    <div
      className="aspect-video overflow-hidden rounded-[15px] bg-black sm:rounded-[18px]"
      onPointerDown={() => {
        if (tracked.current) return;
        tracked.current = true;
        trackMetaCustomEvent("VideoPlay", { video_id: mediaId, placement: "Vendor audit page" });
      }}
    >
      <iframe
        src={`https://fast.wistia.net/embed/iframe/${mediaId}?seo=true&videoFoam=true&playerColor=8f33ff`}
        title="Arcanium Suburb Visibility Audit"
        allow="autoplay; fullscreen"
        allowFullScreen
        loading="eager"
        className="h-full w-full border-0"
      />
    </div>
  );
}
