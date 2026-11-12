"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Point = { x: number; y: number; radius: number };
type Layout = { width: number; height: number; points: Point[] };
const journeys = [
  { name: "Ready seller", nodes: [0, 1, 2, 4, 5], summary: "Ready sellers move directly from qualification to booking and the agent’s appraisal." },
  { name: "No answer", nodes: [0, 1, 3, 1, 2, 4, 5], summary: "Unanswered enquiries receive follow-up, return to the conversation, then progress to qualification and booking when ready." },
  { name: "Future seller", nodes: [0, 1, 2, 3, 6, 4, 5], summary: "Future sellers enter follow-up and ongoing nurture, returning to booking when their timing changes." },
];

/** Round the orthogonal routes so the signal follows the existing grid's gutters. */
function roundedPath(points: { x: number; y: number }[]) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const before = Math.hypot(b.x - a.x, b.y - a.y);
    const after = Math.hypot(c.x - b.x, c.y - b.y);
    if (before < 1 || after < 1) continue;
    const r = Math.min(10, before / 2, after / 2);
    d += ` L ${b.x + (a.x - b.x) * r / before} ${b.y + (a.y - b.y) * r / before}`;
    d += ` Q ${b.x} ${b.y} ${b.x + (c.x - b.x) * r / after} ${b.y + (c.y - b.y) * r / after}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

function connection(layout: Layout, from: number, to: number) {
  let a = layout.points[from], b = layout.points[to];
  const reverse = a.y > b.y + 8;
  if (reverse) [a, b] = [b, a];
  let points: { x: number; y: number }[];
  if (Math.abs(a.y - b.y) < 8) {
    points = [a, b];
  } else {
    const side = a.x < layout.width / 2 ? 11 : layout.width - 11;
    const exit = a.y + a.radius + (a.radius <= 20 ? 5 : 12);
    const entry = b.y - b.radius - 12;
    points = [a, { x: a.x, y: exit }, { x: side, y: exit }, { x: side, y: entry }, { x: b.x, y: entry }, b];
  }
  return roundedPath(reverse ? points.reverse() : points);
}

/** Enhances the existing six-stage layout; the copy is server-rendered and always visible. */
export function SellerJourneyMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const signal = useRef<SVGCircleElement>(null);
  const engine = useRef<{ wake: () => void } | null>(null);
  const paused = useRef(false);
  const completedRun = useRef("");
  const [layout, setLayout] = useState<Layout | null>(null);
  const [scenario, setScenario] = useState(0);
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "complete">("idle");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || !("ResizeObserver" in window) || !("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = el.getBoundingClientRect();
        const nodes = el.querySelectorAll<HTMLElement>("[data-journey-node]");
        const points = Array.from(nodes, node => {
          const r = node.getBoundingClientRect();
          return { x: r.left - bounds.left + r.width / 2, y: r.top - bounds.top + r.height / 2, radius: r.height / 2 };
        });
        if (points.length !== 7) return;
        const next = { width: el.clientWidth, height: el.clientHeight, points };
        setLayout(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.querySelectorAll(".process-step, .process-nurture").forEach(node => observer.observe(node));
    document.fonts.ready.then(measure);
    measure();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); preference.removeEventListener("change", syncPreference); };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !layout) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-journey-node]"));
    const route = journeys[scenario].nodes;
    const drawnPaths = paths.current.slice(0, route.length - 1);
    const lengths = drawnPaths.map(path => path?.getTotalLength() ?? 0);
    let frame = 0, last = 0, elapsed = 0, edge = 0, moving = false, visible = false, finished = false;
    el.classList.add("journey-enhanced");
    el.dataset.journey = String(scenario);
    nodes.forEach((node, index) => {
      node.classList.remove("journey-current", "journey-visited", "journey-booked");
      node.classList.toggle("journey-on-route", route.includes(index));
    });
    const settled = reduced || completedRun.current === `${scenario}:${run}`;
    drawnPaths.forEach(path => path?.setAttribute("stroke-dashoffset", settled ? "0" : "1"));
    if (settled) {
      route.forEach(index => nodes[index].classList.add("journey-visited"));
      nodes[4].classList.add("journey-booked");
      signal.current?.setAttribute("opacity", "0");
      el.dataset.playing = "false";
      return;
    }
    const mark = (index: number) => {
      nodes.forEach(node => node.classList.remove("journey-current"));
      nodes[index].classList.add("journey-current", "journey-visited");
      if (index === 4) nodes[index].classList.add("journey-booked");
    };
    mark(route[0]);
    signal.current?.setAttribute("opacity", "0");
    const holdDuration = () => route[edge] === 1 || route[edge] === 4 ? 800 : 420;
    const canPlay = () => {
      if (!visible || paused.current || document.hidden || finished) return false;
      // On phones, wait for the next stage to enter view rather than finishing below the fold.
      const next = nodes[route[Math.min(edge + 1, route.length - 1)]].getBoundingClientRect();
      return (!moving && elapsed < holdDuration()) || next.top < innerHeight - 50;
    };
    const wake = () => {
      if (!frame && canPlay()) {
        last = 0;
        el.dataset.playing = "true";
        setStatus("playing");
        frame = requestAnimationFrame(tick);
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!canPlay()) { el.dataset.playing = "false"; last = 0; return; }
      if (last) elapsed += Math.min(now - last, 50);
      last = now;
      const hold = holdDuration();
      if (!moving && elapsed >= hold) { elapsed = 0; moving = true; }
      if (moving) {
        const path = drawnPaths[edge];
        const progress = Math.min(elapsed / 650, 1);
        const eased = progress * progress * (3 - 2 * progress);
        if (path) {
          path.setAttribute("stroke-dashoffset", String(1 - eased));
          const point = path.getPointAtLength(lengths[edge] * eased);
          signal.current?.setAttribute("cx", String(point.x));
          signal.current?.setAttribute("cy", String(point.y));
          signal.current?.setAttribute("opacity", "1");
        }
        if (progress >= 1) {
          edge++;
          elapsed = 0;
          moving = false;
          signal.current?.setAttribute("opacity", "0");
          mark(route[edge]);
          if (edge === route.length - 1) {
            finished = true;
            completedRun.current = `${scenario}:${run}`;
            el.dataset.playing = "false";
            setStatus("complete");
            return;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; last = 0; el.dataset.playing = "false"; }
      wake();
    }, { threshold: 0 });
    observer.observe(el);
    const syncVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; el.dataset.playing = "false"; }
      else wake();
    };
    engine.current = { wake };
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", syncVisibility);
      engine.current = null;
    };
  }, [layout, scenario, run, reduced]);

  function select(index: number) {
    paused.current = false;
    setStatus("idle");
    setScenario(index);
    setRun(n => n + 1);
  }
  function toggle() {
    if (status === "complete") { paused.current = false; setStatus("idle"); setRun(n => n + 1); }
    else { paused.current = !paused.current; setStatus(paused.current ? "paused" : "playing"); engine.current?.wake(); }
  }

  const route = journeys[scenario].nodes;
  return <div className="process-graphic" ref={root}>
    <div className="journey-tools">
      <div className="journey-options" role="group" aria-label="Explore an illustrative seller journey">
        {journeys.map((journey, index) => <button type="button" key={journey.name} aria-pressed={scenario === index} onClick={() => select(index)}>{journey.name}</button>)}
      </div>
      <button className="journey-playback" type="button" onClick={toggle} aria-label={status === "complete" ? "Replay journey" : status === "paused" ? "Resume journey" : "Pause journey"}>
        {status === "complete" ? <RotateCcw size={15} /> : status === "paused" ? <Play size={15} /> : <Pause size={15} />}
      </button>
      <span className="sr-only" aria-live="polite">Illustrative journey. {journeys[scenario].summary}</span>
    </div>
    {layout && <svg className="journey-lines" viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height} aria-hidden="true">
      {route.slice(0, -1).map((from, index) => <g key={`${scenario}-${index}`}>
        <path className="journey-route-base" d={connection(layout, from, route[index + 1])} />
        <path className="journey-route-drawn" d={connection(layout, from, route[index + 1])} pathLength={1} strokeDasharray="1" strokeDashoffset="1" ref={node => { paths.current[index] = node; }} />
      </g>)}
      <circle className="journey-signal" ref={signal} r="3.5" opacity="0" />
    </svg>}
    {children}
  </div>;
}
