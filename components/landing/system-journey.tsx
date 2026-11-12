"use client";

import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Home,
  MapPin,
  MessageCircle,
  Megaphone,
  RotateCcw,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./system-journey.module.css";

function Step({ children, n, reverse = false }: { children: React.ReactNode; n: string; reverse?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true);
    }, { threshold: 0.38, rootMargin: "0px 0px -10% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <article ref={ref} className={`${styles.step} ${reverse ? styles.reverse : ""} ${seen ? styles.seen : ""}`}>
    <span className={styles.number}>{n}</span>
    <div className={styles.replayLayer} key={run}>{children}</div>
    <button className={styles.replayButton} type="button" onClick={() => setRun((value) => value + 1)} aria-label={`Replay step ${Number(n)} animation`}>
      <RotateCcw /> Replay
    </button>
  </article>;
}

export function SystemJourney() {
  return <div className={styles.journey}>
    <Step n="01">
      <div className={styles.copy}><b>Step 1</b><h3>We launch your local seller campaign</h3><p>Campaign creative, local targeting and the enquiry path are built to work as one.</p></div>
      <div className={`${styles.visual} ${styles.campaignScene}`}>
        <div className={styles.sceneTopline}><span><Megaphone />Campaign builder</span><em>Preparing launch</em></div>
        <div className={styles.creativeDeck} aria-label="Local seller campaign creative examples">
          <figure className={styles.creativeOne}><Image src="/images/campaign-creative/mary-pelican-2026.png" alt="Pelican Waters property campaign" width={360} height={360} /></figure>
          <figure className={styles.creativeTwo}><Image src="/images/campaign-creative/kael-castle-street-2026.png" alt="Castle Hill street appraisal campaign" width={360} height={360} /></figure>
          <figure className={styles.creativeThree}><Image src="/images/campaign-creative/mary-currimundi-worth-map.png" alt="Currimundi property campaign" width={360} height={360} /></figure>
          <span className={styles.creativeSelected}><Check />Creative selected</span>
        </div>
        <div className={styles.targetPanel}>
          <header><Target /><span><strong>Local targeting</strong>Seller homeowners</span></header>
          <div className={styles.targetMap}>
            <span className={styles.targetRing} />
            <i className={styles.targetPinA}><MapPin /></i>
            <i className={styles.targetPinB}><Home /></i>
            <i className={styles.targetPinC}><MapPin /></i>
          </div>
          <div className={styles.marketChips}><span>Castle Hill</span><span>Kellyville</span><span>Local owners</span></div>
        </div>
        <div className={styles.launchRail}><span>Seller appraisal campaign</span><i className={styles.launchToggle}><b /></i><strong>Live</strong></div>
        <div className={styles.enquiryToast}><UserRound /><span><strong>New homeowner enquiry</strong>Interested in a property appraisal</span></div>
      </div>
    </Step>

    <Step n="02" reverse>
      <div className={styles.copy}><b>Step 2</b><h3>The assistant turns interest into an appraisal</h3><p>Every enquiry receives a fast, useful response and a clear route toward an available appointment.</p></div>
      <div className={`${styles.visual} ${styles.conversationScene}`}>
        <div className={styles.conversationProgress} aria-hidden="true">
          <span className={styles.progressOne}>New enquiry</span><ArrowRight /><span className={styles.progressTwo}>Replied in 12 sec</span><ArrowRight /><span className={styles.progressThree}>Booked</span>
        </div>
        <div className={styles.phone}>
          <header><span><MessageCircle />Sarah M.</span><em>now</em></header>
          <p className={styles.homeownerBubble}>I’m curious what my home might be worth.</p>
          <div className={styles.typingBubble} aria-label="Assistant typing"><i /><i /><i /></div>
          <p className={styles.assistantBubble}>Would you prefer a rough price guide or a more accurate appraisal?</p>
          <p className={styles.homeownerChoice}>An appraisal would be helpful.</p>
          <div className={styles.timeOptions}><span>Thu 4:00 pm</span><span>Fri 10:30 am</span></div>
          <div className={styles.selectedTime}><CalendarCheck /><span><strong>Thursday, 4:00 pm</strong>Appraisal confirmed</span></div>
          <footer><span>Text message · SMS</span><i /></footer>
        </div>
        <div className={styles.bookingToast}><CalendarCheck /><span><strong>Appraisal booked</strong>Calendar and pipeline updated</span></div>
      </div>
    </Step>

    <Step n="03">
      <div className={styles.copy}><b>Step 3</b><h3>You walk in. The system stays in the deal.</h3><p>The opportunity, follow-up and next action remain visible while the agent focuses on the homeowner.</p></div>
      <div className={`${styles.visual} ${styles.pipelineScene}`}>
        <div className={styles.sceneTopline}><span><Sparkles />Seller pipeline</span><em>Working in the background</em></div>
        <div className={styles.pipelineBoard}>
          <section><header>Appraisal booked</header><div className={styles.stageHint}><CalendarCheck />Thu · 4:00 pm</div></section>
          <section><header>Follow-up ready</header><div className={styles.followupTask}><Clock3 /><span><strong>Next action</strong>Follow-up scheduled</span><Check /></div></section>
          <section><header>Listing opportunity</header><div className={styles.listingSignal}><Sparkles /><span><strong>Opportunity active</strong>Agent has full context</span></div></section>
          <div className={styles.dealCard}><span>SM</span><strong>Sarah M.</strong><small>12 Beach Road</small></div>
          <div className={styles.progressTrail}><i /><i /><i /></div>
        </div>
        <div className={styles.pipelineResult}><Check /><span><small>Pipeline updated automatically</small><strong>Every next action stays visible</strong></span></div>
      </div>
    </Step>
  </div>;
}
