"use client";

import {
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCheck,
  FileSignature,
  Home,
  Lock,
  MapPin,
  MessageCircle,
  Presentation,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./selected-system-journey.module.css";

function JourneyStep({ number, eyebrow, title, description, points, children }: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.24 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article id={`journey-step-${number}`} ref={ref} className={`${styles.step} ${active ? styles.active : ""}`}>
      <div className={styles.visual}>{children}</div>
      <div className={styles.copy}>
        <span className={styles.stepNumber}>{number}</span>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h3>{title}</h3>
        <p className={styles.description}>{description}</p>
        <ul>{points.map(point => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
      </div>
    </article>
  );
}

const routes = [
  ["M 350 285 Q 305 210 236 218", 236, 218],
  ["M 350 285 Q 393 205 456 196", 456, 196],
  ["M 350 285 Q 445 278 492 308", 492, 308],
  ["M 350 285 Q 405 354 444 400", 444, 400],
  ["M 350 285 Q 319 361 276 404", 276, 404],
  ["M 350 285 Q 264 297 205 330", 205, 330],
] as const;

function TerritoryRadar() {
  return (
    <div className={`${styles.scene} ${styles.radarScene}`}>
      <svg className={styles.radarMap} viewBox="0 0 700 560" aria-hidden="true">
        <g className={styles.mapRoads}>
          <path d="M-20 110 C160 90 352 126 720 98" /><path d="M-20 222 C170 244 410 200 720 238" />
          <path d="M-20 364 C180 338 386 382 720 345" /><path d="M-20 490 C188 462 472 510 720 470" />
          <path d="M105-20 C130 170 82 360 120 590" /><path d="M256-20 C222 190 284 370 250 590" />
          <path d="M452-20 C420 170 476 380 446 590" /><path d="M610-20 C570 170 634 382 596 590" />
        </g>
        <path className={styles.mainRoad} d="M-20 510 C145 430 325 245 720 54" />
        <path className={styles.territoryShape} pathLength="100" d="M214 169 L443 146 L523 274 L467 429 L257 442 L164 306 Z" />
        {routes.map(([path, cx, cy], index) => (
          <g key={path} style={{ "--i": index } as CSSProperties}>
            <path className={styles.route} pathLength="100" d={path} />
            <circle className={styles.routeHome} cx={cx} cy={cy} r="7" />
          </g>
        ))}
        <g className={styles.radarCore}>
          <circle className={styles.ringOne} cx="350" cy="285" r="40" />
          <circle className={styles.ringTwo} cx="350" cy="285" r="40" />
          <circle className={styles.ringThree} cx="350" cy="285" r="40" />
          <circle className={styles.coreGlow} cx="350" cy="285" r="20" />
          <circle className={styles.coreDot} cx="350" cy="285" r="7" />
        </g>
      </svg>
      <div className={styles.mapLabel}><MapPin /> Your campaign area</div>
      <div className={`${styles.lockedArea} ${styles.lockedOne}`}><Lock /> Agent secured</div>
      <div className={`${styles.lockedArea} ${styles.lockedTwo}`}><Lock /> Agent secured</div>
      <div className={styles.lockBar}><span><Lock /></span><div><strong>Your suburb, under your brand</strong><small>One local campaign. One clear market position.</small></div></div>
    </div>
  );
}

const messages = [
  { side: "out", text: "Hi Sarah, saw you requested a property appraisal. Are you thinking of selling soon?" },
  { side: "in", text: "Yes, looking to list before Christmas" },
  { side: "out", text: "Perfect. Would Tuesday at 4pm or Thursday at 10am suit you better?" },
  { side: "in", text: "Tuesday works" },
] as const;

function ConciergeThread() {
  return (
    <div className={`${styles.scene} ${styles.conciergeScene}`}>
      <div className={styles.phoneGlow} />
      <div className={styles.phone}>
        <div className={styles.phoneTop}><span>9:41</span><i /><b>AI QUALIFICATION · LIVE</b></div>
        <div className={styles.contactRow}><span>SM</span><div><strong>Sarah Mitchell</strong><small>Local homeowner</small></div><MessageCircle /></div>
        <div className={styles.thread}>
          {messages.map((message, index) => (
            <div className={`${styles.bubble} ${message.side === "out" ? styles.outgoing : styles.incoming}`} key={message.text} style={{ "--i": index } as CSSProperties}>
              {message.text}
              {message.side === "out" && index === 2 ? <small><CheckCheck /> Delivered</small> : null}
            </div>
          ))}
          <div className={styles.typing}><i /><i /><i /></div>
        </div>
        <div className={styles.homeIndicator} />
      </div>
      <div className={styles.bookedToast}><CalendarCheck2 /><div><strong>Appraisal booked</strong><small>Sarah · Tuesday 4:00pm · 23 King Street</small></div><b>now</b></div>
    </div>
  );
}

const timelineStages = [
  { icon: CalendarCheck2, title: "Appraisal: 23 King Street", detail: "Booked by the assistant. You just show up.", meta: "TUE · 4PM", success: false },
  { icon: Presentation, title: "Listing presentation prepared", detail: "Pricing, objections and vendor context ready.", meta: "READY", success: false },
  { icon: FileSignature, title: "Listing signed: 23 King Street", detail: "Exclusive agency agreement secured.", meta: "SIGNED", success: true },
] as const;

function DealTimeline() {
  return (
    <div className={`${styles.scene} ${styles.timelineScene}`}>
      <div className={styles.timelineRail}><i /></div>
      <div className={styles.timelineCards}>
        {timelineStages.map(({ icon: Icon, title, detail, meta, success }, index) => (
          <div className={`${styles.timelineCard} ${success ? styles.successCard : ""}`} style={{ "--i": index } as CSSProperties} key={title}>
            <span><Icon /></span><div><strong>{title}</strong><small>{detail}</small></div><b>{meta}</b>{success ? <Check /> : null}
          </div>
        ))}
        <div className={styles.proofCard}><span><Home /></span><div><strong>One connected seller journey</strong><small>From first enquiry to signed listing</small></div><BadgeCheck /></div>
      </div>
    </div>
  );
}

export function SelectedSystemJourney() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.shell}>
        <header className={styles.heading}>
          <p>How it works</p>
          <h2>From local attention to a signed listing.</h2>
          <span>Three connected stages show how the system creates demand, starts the conversation and keeps the opportunity moving.</span>
        </header>

        <JourneyStep number="01" eyebrow="Local campaign" title="Own the attention in your local market." description="Your campaign activates around the suburb, reaches local homeowners and keeps every signal connected to your brand." points={["Local campaign activated", "Neighbourhood reach expanding", "Your market position stays visible"]}>
          <TerritoryRadar />
        </JourneyStep>

        <JourneyStep number="02" eyebrow="AI appointment setting" title="Every conversation moves toward a real appointment." description="A natural exchange appears step by step and resolves into a confirmed appraisal without the lead being left in an inbox." points={["Fast personal response", "Simple appointment choices", "Booking confirmed automatically"]}>
          <ConciergeThread />
        </JourneyStep>

        <JourneyStep number="03" eyebrow="Listing conversion" title="The booking is only the beginning." description="The appraisal progresses through preparation and presentation support before resolving into a signed listing." points={["Appraisal booked", "Presentation prepared", "Listing signed"]}>
          <DealTimeline />
        </JourneyStep>
      </div>
    </section>
  );
}

