"use client";

import { useEffect } from "react";

/** Both cards share a clock; the left signal stalls while managed follow-up continues. */
function comparisonStory(root: HTMLElement, reduced: boolean) {
  if (!("IntersectionObserver" in window) || !("ResizeObserver" in window)) return () => {};
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".pipeline-path"));
  const rows = cards.map(card => Array.from(card.querySelectorAll<HTMLElement>(".pipeline-flow-row")));
  if (rows.length !== 2 || rows.some(list => list.length !== 5)) return () => {};
  let step = -1, visible = false, timer: ReturnType<typeof setTimeout> | undefined, finished = false;
  root.classList.add("comparison-enhanced");
  const measure = () => {
    cards.forEach((card, side) => {
      const wrap = card.querySelector<HTMLElement>(".comparison-journey")!;
      const bounds = wrap.getBoundingClientRect();
      const first = rows[side][0].querySelector(".pipeline-flow-icon")!.getBoundingClientRect();
      const last = rows[side][4].querySelector(".pipeline-flow-icon")!.getBoundingClientRect();
      wrap.style.setProperty("--rail-x", `${first.left - bounds.left + first.width / 2}px`);
      wrap.style.setProperty("--rail-top", `${first.top - bounds.top + first.height / 2}px`);
      wrap.style.setProperty("--rail-height", `${last.top + last.height / 2 - first.top - first.height / 2}px`);
      place(side, Math.min(Math.max(step, 0), side === 0 ? 2 : 4));
    });
  };
  const place = (side: number, index: number) => {
    const wrap = cards[side].querySelector<HTMLElement>(".comparison-journey")!;
    const icon = rows[side][index].querySelector(".pipeline-flow-icon")!.getBoundingClientRect();
    const bounds = wrap.getBoundingClientRect();
    const bead = cards[side].querySelector<HTMLElement>(".comparison-signal")!;
    bead.style.setProperty("--signal-x", `${icon.left - bounds.left + icon.width / 2}px`);
    bead.style.setProperty("--signal-y", `${icon.top - bounds.top + icon.height / 2}px`);
  };
  const show = (index: number) => {
    step = index;
    cards.forEach((card, side) => {
      const position = Math.min(index, side === 0 ? 2 : 4);
      rows[side].forEach((row, i) => {
        row.classList.toggle("comparison-reached", i <= position);
        row.classList.toggle("comparison-current", i === position);
        row.classList.toggle("comparison-stalled", side === 0 && i === 2 && index >= 2);
      });
      card.classList.toggle("comparison-lost", side === 0 && index >= 3);
      card.classList.toggle("comparison-resolved", side === 1 && index === 4);
      place(side, position);
    });
  };
  const wake = () => {
    if (timer || !visible || document.hidden || finished || reduced) return;
    const next = Math.min(step + 1, 4);
    if (rows[1][next].getBoundingClientRect().bottom > innerHeight - 35) return;
    show(next);
    root.dataset.playing = "true";
    timer = setTimeout(() => {
      timer = undefined;
      if (step === 4) { finished = true; root.dataset.playing = "false"; return; }
      root.dataset.playing = "false";
      wake();
    }, 900);
  };
  const visibility = () => {
    if (document.hidden && timer) { clearTimeout(timer); timer = undefined; root.dataset.playing = "false"; }
    else wake();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible && timer) { clearTimeout(timer); timer = undefined; root.dataset.playing = "false"; }
    wake();
  });
  const resize = new ResizeObserver(measure);
  cards.forEach(card => resize.observe(card));
  measure();
  if (reduced) { show(4); root.dataset.playing = "false"; }
  else observer.observe(root);
  window.addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  return () => {
    if (timer) clearTimeout(timer);
    observer.disconnect(); resize.disconnect();
    window.removeEventListener("scroll", wake);
    document.removeEventListener("visibilitychange", visibility);
  };
}

/** Progressive enhancement: all content remains readable without JavaScript. */
export function FunnelMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let stories: (() => void)[] = [];
    const targets = document.querySelectorAll<HTMLElement>("[data-motion], .pipeline-intent-card figure");
    const sync = () => {
      observer?.disconnect();
      stories.forEach(dispose => dispose());
      stories = [];
      document.querySelectorAll<HTMLElement>("[data-comparison-story]").forEach(root => stories.push(comparisonStory(root, preference.matches)));
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("motion-played");
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
      targets.forEach(target => observer?.observe(target));
    };
    sync();
    preference.addEventListener("change", sync);
    return () => {
      observer?.disconnect(); stories.forEach(dispose => dispose());
      preference.removeEventListener("change", sync);
    };
  }, []);
  return null;
}
