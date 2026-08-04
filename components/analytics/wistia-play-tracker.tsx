"use client";

import { useEffect } from "react";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

interface WistiaPlayTrackerProps {
  mediaId: string;
  placement: string;
}

export function WistiaPlayTracker({
  mediaId,
  placement,
}: WistiaPlayTrackerProps) {
  useEffect(() => {
    const player = document.querySelector(
      `wistia-player[media-id="${mediaId}"]`
    );

    if (!player) return;

    const handlePlay = () => {
      trackMetaCustomEvent("VideoPlay", {
        video_id: mediaId,
        placement,
      });
    };

    player.addEventListener("play", handlePlay, { once: true });
    return () => player.removeEventListener("play", handlePlay);
  }, [mediaId, placement]);

  return null;
}
