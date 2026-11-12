"use client";

import { CalendarCheck, Check, Home, MapPin, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./system-journey.module.css";

const stages = [
  { title: "Ad", copy: "Scroll-stopping ads reach local owners on Facebook, Instagram and Google." },
  { title: "Lead", copy: "An owner checks what their home is worth, and the lead comes straight to you." },
  { title: "Appraisal", copy: "Value-led nurturing keeps you top of mind until the appraisal is booked." },
  { title: "Listing", copy: "You walk in as the agent they already know, and win the listing." },
];

function PhoneScreen({ stage }: { stage: number }) {
  if (stage === 0) return <div className={styles.screenContent} key="ad">
    <span className={styles.screenEyebrow}>Local property update</span>
    <h3>What&apos;s your home worth?</h3>
    <p>Get an instant price estimate in seconds.</p>
    <div className={styles.addressField}><Search /><span>Enter your address...</span></div>
    <button type="button" tabIndex={-1}>Get estimate</button>
  </div>;

  if (stage === 1) return <div className={styles.screenContent} key="lead">
    <span className={styles.successIcon}><Check /></span>
    <h3>Enquiry received</h3>
    <p>Your local property update is on its way.</p>
    <div className={styles.propertyCard}><MapPin /><span><small>Property</small><strong>6 Fort Street, Buderim</strong></span></div>
    <button type="button" tabIndex={-1}>View update</button>
  </div>;

  if (stage === 2) return <div className={styles.screenContent} key="appraisal">
    <span className={styles.successIcon}><Check /></span>
    <h3>Appraisal booked</h3>
    <p>We&apos;ll see you at 6 Fort Street.</p>
    <div className={styles.appointmentCard}><b>THU<em>30</em></b><span><small>Free appraisal</small><strong>10:30am · 6 Fort Street</strong></span></div>
    <button type="button" tabIndex={-1}>Add to calendar</button>
  </div>;

  return <div className={styles.screenContent} key="listing">
    <span className={styles.successIcon}><Home /></span>
    <h3>Listing secured</h3>
    <p>The homeowner already knows who to call.</p>
    <div className={styles.propertyCard}><Check /><span><small>Signed listing</small><strong>6 Fort Street, Buderim</strong></span></div>
    <button type="button" tabIndex={-1}>Opportunity won</button>
  </div>;
}

export function SystemJourney() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const progress = Math.min(0.999, Math.max(0, -rect.top / travel));
      setActive(Math.min(3, Math.floor(progress * 4)));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <section ref={root} className={styles.journey} aria-label="How an ad becomes a listing">
    <div className={styles.sticky}>
      <ol className={styles.timeline}>
        {stages.map((stage, index) => <li key={stage.title} className={index <= active ? styles.complete : ""} aria-current={index === active ? "step" : undefined}>
          <span>{index + 1}</span>
          <div><h3>{stage.title}</h3><p>{stage.copy}</p></div>
        </li>)}
      </ol>
      <div className={styles.mobileStage} key={stages[active].title}>
        <h3>{stages[active].title}</h3>
        <p>{stages[active].copy}</p>
      </div>

      <div className={`${styles.stage} ${styles[`stage${active}`]}`}>
        <div className={styles.creativeCardOne}><span>LOCAL PROPERTY UPDATE</span><strong>What&apos;s your home worth?</strong><small>Get your free estimate</small></div>
        <div className={styles.creativeCardTwo}><span>JUST SOLD</span><strong>6 Fort Street</strong><small>Buderim</small></div>
        <div className={styles.guideCard}><small>SELLER GUIDE</small><strong>The complete guide to selling your property</strong></div>

        <div className={styles.phone}><i /><div className={styles.phoneScreen}><PhoneScreen stage={active} /></div></div>

        <div className={styles.notifications} aria-live="polite">
          <div className={styles.noticeLead}><span><UserRound /></span><p><small>New seller lead</small><strong>6 Fort Street, Buderim</strong></p></div>
          <div className={styles.noticeAppraisal}><span>SM</span><p><small>Appraisal booked</small><strong>Thu 30 Oct · 10:30am</strong></p></div>
          <div className={styles.noticeListing}><span><Home /></span><p><small>Listing signed</small><strong>6 Fort Street, Buderim</strong></p></div>
        </div>
      </div>
    </div>
  </section>;
}
