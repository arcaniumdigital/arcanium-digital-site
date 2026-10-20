"use client";

import { useEffect, useRef } from "react";

export function FunnelProgress() {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      // Front-load the visual movement, then gradually settle toward the finish.
      const fill = (1 - Math.exp(-5 * progress)) / (1 - Math.exp(-5));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${fill})`;
      // Assistive technology gets the actual scroll distance, without easing.
      trackRef.current?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  return <div className="funnel-progress-wrap">
    <div ref={trackRef} className="funnel-progress" role="progressbar" aria-label="Page scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <span ref={fillRef} className="funnel-progress-fill" />
    </div>
  </div>;
}
