"use client";

import { CalendarCheck, Check, Home, Lock, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./system-journey.module.css";

function Step({ children, n, reverse = false }: { children: React.ReactNode; n: string; reverse?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true);
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <article ref={ref} className={`${styles.step} ${reverse ? styles.reverse : ""} ${seen ? styles.seen : ""}`}>
    <span className={styles.number}>{n}</span>{children}
  </article>;
}

export function SystemJourney() {
  return <div className={styles.journey}>
    <Step n="01">
      <div className={styles.copy}><b>Step 1</b><h3>We launch your local seller campaign</h3><p>Campaign creative, local targeting and the enquiry path are built to work as one.</p></div>
      <div className={`${styles.visual} ${styles.map}`}>
        <div className={styles.grid} />
        <svg viewBox="0 0 650 420" aria-hidden="true">
          <path className={styles.road} d="M45 315C130 240 180 300 250 205S390 225 455 120 560 138 620 58" />
          <path className={styles.roadMuted} d="M20 365C150 320 210 385 300 280S470 285 630 165" />
          <path className={styles.territory} d="M198 116L412 92L514 194L464 346L250 358L154 236Z" pathLength="100" />
          <g className={styles.routes}>
            <path d="M332 228Q284 184 246 166" pathLength="100" />
            <path d="M332 228Q404 165 437 151" pathLength="100" />
            <path d="M332 228Q414 246 458 282" pathLength="100" />
          </g>
        </svg>
        <i className={styles.pinA}><MapPin /></i><i className={styles.pinB}><Home /></i><i className={styles.pinC}><MapPin /></i>
        <span className={styles.areaLabel}>Your market</span>
        <div className={styles.locked}><Lock /><span>Your area, under your brand<strong>Campaign live</strong></span></div>
      </div>
    </Step>
    <Step n="02" reverse>
      <div className={styles.copy}><b>Step 2</b><h3>The assistant turns interest into an appraisal</h3><p>Every enquiry receives a fast, useful response and a clear route toward an available appointment.</p></div>
      <div className={`${styles.visual} ${styles.aiScene}`}>
        <div className={styles.livePill}><span />AI qualification · Live</div>
        <div className={styles.bookingToast}><CalendarCheck /><span><strong>Appraisal booked</strong>Sarah M. · Thu 4:00 pm</span></div>
        <div className={styles.phone}>
          <header><span><MessageCircle />Sarah M.</span><em>9:41</em></header>
          <p>Would you prefer a rough price guide or a more accurate appraisal?</p>
          <p>An appraisal would be helpful.</p>
          <p>Perfect. Here are two available times.</p>
          <footer><span>Text message · SMS</span><i /></footer>
        </div>
      </div>
    </Step>
    <Step n="03">
      <div className={styles.copy}><b>Step 3</b><h3>You walk in. The system stays in the deal.</h3><p>The opportunity, follow-up and next action remain visible while the agent focuses on the homeowner.</p></div>
      <div className={`${styles.visual} ${styles.pipeline}`}>
        <div className={styles.line} />
        {[["Appraisal booked","Thursday · 4:00 pm"],["Appraisal completed","Follow-up ready"],["Listing opportunity","Next action visible"]].map(([title, meta], index) => <div className={styles.row} key={title}><i><Check /></i><span><strong>{title}</strong>{meta}</span>{index === 2 && <Sparkles />}</div>)}
        <div className={styles.resultCard}><span>Opportunity progressed</span><strong>One connected seller journey</strong></div>
      </div>
    </Step>
  </div>;
}
