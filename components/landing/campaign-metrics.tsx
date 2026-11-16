"use client";
import { useEffect, useRef } from "react";
const metrics = [{ label: "Seller Enquiries", value: 16, format: (value: number) => Math.floor(value).toString() }, { label: "Appraisal booked", value: 1, format: (value: number) => Math.floor(value).toString() }, { label: "Total ad spend", value: 243.05, format: (value: number) => `$${value.toFixed(2)}` }];
export function CampaignMetrics() {
  const root = useRef<HTMLDListElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const counters = element.querySelectorAll<HTMLElement>("[data-metric-count]");
    let frame = 0;
    let played = false;
    const render = (progress: number) => counters.forEach((counter, index) => { counter.textContent = metrics[index].format(metrics[index].value * progress); });
    const observer = new IntersectionObserver(entries => {
      if (played || !entries.some(entry => entry.isIntersecting)) return;
      played = true;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 1000);
        render(1 - Math.pow(1 - progress, 3));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      render(0);
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    const reduce = () => { if (preference.matches) { played = true; observer.disconnect(); cancelAnimationFrame(frame); render(1); } };
    observer.observe(element);
    preference.addEventListener("change", reduce);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); preference.removeEventListener("change", reduce); };
  }, []);
  return <dl ref={root} className="mv-metrics">{metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd><span aria-hidden="true" data-metric-count>{metric.format(metric.value)}</span><span className="sr-only">{metric.format(metric.value)}</span></dd></div>)}</dl>;
}
