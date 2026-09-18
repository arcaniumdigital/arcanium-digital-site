"use client";

import { useEffect, useRef } from "react";

interface WistiaPlayerElement extends HTMLElement {
  play: () => Promise<void> | void;
}

const MEDIA_ID = "z8jusqm7ag";

export function ViewportWistiaPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let hasStarted = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5 || hasStarted) {
          return;
        }

        hasStarted = true;
        observer.disconnect();

        void customElements.whenDefined("wistia-player").then(() => {
          const player = container.querySelector<WistiaPlayerElement>(
            `wistia-player[media-id="${MEDIA_ID}"]`,
          );
          const playback = player?.play();

          if (playback instanceof Promise) {
            void playback.catch(() => undefined);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="showcase-wistia-player absolute inset-0"
      dangerouslySetInnerHTML={{
        __html: `<wistia-player media-id="${MEDIA_ID}" aspect="1.6" silent-autoplay="allow" volume="1"></wistia-player>`,
      }}
    />
  );
}
