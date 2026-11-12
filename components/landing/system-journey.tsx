"use client";

import { CalendarCheck, Check, Home, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";
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
    }, { threshold: 0.34, rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <article ref={ref} className={`${styles.step} ${reverse ? styles.reverse : ""} ${seen ? styles.seen : ""}`}>
    <span className={styles.number}>{n}</span>
    {children}
  </article>;
}

export function SystemJourney() {
  return <div className={styles.journey}>
    <Step n="01">
      <div className={styles.copy}><b>Step 1</b><h3>We launch your local seller campaign</h3><p>Campaign creative, local targeting and the enquiry path are built to work as one.</p></div>
      <div className={`${styles.visual} ${styles.mapScene}`} aria-label="A local area becoming active under the agent's brand">
        <div className={styles.mapGrid} aria-hidden="true"><i className={styles.roadOne} /><i className={styles.roadTwo} /><i className={styles.roadThree} /><i className={styles.roadFour} /></div>
        <span className={`${styles.takenArea} ${styles.takenOne}`}><LockKeyhole /> Taken</span>
        <span className={`${styles.takenArea} ${styles.takenTwo}`}><LockKeyhole /> Taken</span>
        <div className={styles.localArea}><span className={styles.localPulse} /><i><Home /></i><strong>Your suburb</strong></div>
        <div className={styles.mapResult}><span><LockKeyhole /></span><p><strong>Your area, under your brand</strong><small>Local homeowner campaigns are live.</small></p><em>Live</em></div>
      </div>
    </Step>

    <Step n="02" reverse>
      <div className={styles.copy}><b>Step 2</b><h3>The assistant turns interest into an appraisal</h3><p>Every enquiry receives a fast, useful response and a clear route toward an available appointment.</p></div>
      <div className={`${styles.visual} ${styles.chatScene}`} aria-label="A homeowner conversation becoming a booked appraisal">
        <div className={styles.bookedBanner}><span><CalendarCheck /></span><p><strong>Appraisal booked</strong><small>Sarah M. · Thu 4:00 pm</small></p><Check /></div>
        <div className={styles.phone}>
          <header><span>SM</span><p><strong>Sarah M.</strong><small>Text message · SMS</small></p><em>now</em></header>
          <div className={styles.messages}>
            <p className={styles.outgoing}>Hi Sarah, would you prefer a rough price guide or a more accurate appraisal?</p>
            <p className={styles.incoming}>An appraisal would be helpful.</p>
            <p className={styles.outgoing}>Perfect. Thursday at 4pm or Friday at 10:30am?</p>
            <p className={styles.incoming}>Thursday works</p>
          </div>
          <footer><MessageCircle /><span>Reply handled in seconds</span></footer>
        </div>
      </div>
    </Step>

    <Step n="03">
      <div className={styles.copy}><b>Step 3</b><h3>You walk in. The system stays in the deal.</h3><p>The opportunity, follow-up and next action remain visible while the agent focuses on the homeowner.</p></div>
      <div className={`${styles.visual} ${styles.dealScene}`} aria-label="An appraisal progressing through the seller pipeline">
        <div className={styles.dealTopline}><Sparkles /><span>Seller opportunity</span><em>Live</em></div>
        <div className={styles.dealLine} aria-hidden="true" />
        <div className={`${styles.dealRow} ${styles.dealRowOne}`}><span><CalendarCheck /></span><p><strong>Appraisal booked</strong><small>12 Beach Road · Thursday, 4:00 pm</small></p><em>Confirmed</em></div>
        <div className={`${styles.dealRow} ${styles.dealRowTwo}`}><span><MessageCircle /></span><p><strong>Follow-up ready</strong><small>The right next action stays visible.</small></p><em>Prepared</em></div>
        <div className={`${styles.dealRow} ${styles.dealRowThree}`}><span><Home /></span><p><strong>Listing opportunity active</strong><small>Context, conversation and timing in one place.</small></p><em>Active</em></div>
        <div className={styles.dealOutcome}><Check /><p><strong>Nothing gets lost after the booking.</strong><small>The agent sees exactly what happens next.</small></p></div>
      </div>
    </Step>
  </div>;
}
