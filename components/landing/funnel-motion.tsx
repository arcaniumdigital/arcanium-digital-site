"use client";

import { useEffect } from "react";

/** Progressive enhancement: all content remains readable without JavaScript. */
export function FunnelMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const targets = document.querySelectorAll<HTMLElement>("[data-motion], .pipeline-intent-card figure, .pipeline-status");
    const sync = () => {
      observer?.disconnect();
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("motion-played");
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
      targets.forEach((target) => observer?.observe(target));
    };
    sync();
    preference.addEventListener("change", sync);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", sync);
    };
  }, []);
  return null;
}
