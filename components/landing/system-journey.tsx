"use client";

import { CalendarCheck, Check, Home, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./system-journey.module.css";

function useSeen() {
  const ref = useRef<HTMLDivElement>(null);
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

  return { ref, seen };
}

export function SystemJourney() {
  const { ref, seen } = useSeen();
  return (
    <div ref={ref} className={`${styles.journey} ${seen ? styles.play : ""}`}>
      <article className={styles.stage}>
        <div className={styles.stageCopy}><span>01</span><div><p>Launch the campaign</p><h3>Reach homeowners in the right local market.</h3></div></div>
        <div className={`${styles.scene} ${styles.mapScene}`} aria-label="Animated local campaign map">
          <div className={styles.mapGrid} aria-hidden="true" />
          <svg className={styles.territory} viewBox="0 0 520 300" aria-hidden="true">
            <path d="M42 206 C96 162 130 176 178 125 C229 70 275 103 315 64 C372 8 424 55 482 30" />
            <path d="M27 248 C103 223 160 260 211 203 C263 146 322 188 365 137 C405 90 453 105 502 79" />
          </svg>
          <div className={`${styles.pin} ${styles.pinOne}`}><MapPin /></div>
          <div className={`${styles.pin} ${styles.pinTwo}`}><Home /></div>
          <div className={`${styles.pin} ${styles.pinThree}`}><MapPin /></div>
          <div className={styles.radius} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.campaignLabel}><span /> Campaign live <strong>Castle Hill + surrounds</strong></div>
        </div>
        <p className={styles.stageFoot}>Campaign, audience and enquiry path managed together.</p>
      </article>

      <article className={styles.stage}>
        <div className={styles.stageCopy}><span>02</span><div><p>Start the conversation</p><h3>Turn the enquiry into a useful next step.</h3></div></div>
        <div className={`${styles.scene} ${styles.chatScene}`} aria-label="Animated seller SMS conversation">
          <div className={styles.phoneTop}><span><MessageCircle /> Seller enquiry</span><i>Live</i></div>
          <div className={`${styles.bubble} ${styles.agentBubble}`}>Hi Sarah, saw you were interested in finding out what your home could be worth. Would you prefer a rough guide or an appraisal?</div>
          <div className={`${styles.bubble} ${styles.sellerBubble}`}>An appraisal would be helpful.</div>
          <div className={`${styles.bubble} ${styles.agentBubble} ${styles.lastBubble}`}>Perfect. I can show you a couple of available times.</div>
          <div className={styles.typing}><span /><span /><span /></div>
          <div className={styles.appointment}><CalendarCheck /><div><strong>Appraisal booked</strong><span>Thursday · 4:00 pm</span></div></div>
        </div>
        <p className={styles.stageFoot}>Fast response, context-aware follow-up and booking.</p>
      </article>

      <article className={styles.stage}>
        <div className={styles.stageCopy}><span>03</span><div><p>Progress the opportunity</p><h3>Keep the next action visible through to listing.</h3></div></div>
        <div className={`${styles.scene} ${styles.pipelineScene}`} aria-label="Animated appraisal to listing progression">
          <div className={styles.progressLine}><span /></div>
          {[["Appraisal booked", "Thursday · 4:00 pm"], ["Listing presentation", "Follow-up complete"], ["Listing signed", "Pipeline outcome recorded"]].map(([title, detail], index) => (
            <div className={styles.pipelineRow} key={title}>
              <span className={styles.rowCheck}><Check /></span>
              <div><strong>{title}</strong><span>{detail}</span></div>
              {index === 2 && <Sparkles className={styles.sparkle} />}
            </div>
          ))}
          <div className={styles.resultCard}><span>Seller pipeline</span><strong>One clear journey</strong></div>
        </div>
        <p className={styles.stageFoot}>A visible outcome, not another forgotten lead.</p>
      </article>
    </div>
  );
}

