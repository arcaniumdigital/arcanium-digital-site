"use client";

import Image from "next/image";
import {
  CalendarCheck,
  Check,
  Home,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import styles from "./system-journey.module.css";

const stages = [
  { title: "Ad", copy: "Scroll-stopping ads reach local owners on Facebook, Instagram and Google." },
  { title: "Lead", copy: "An owner checks what their home is worth, and the lead comes straight to you." },
  { title: "Appraisal", copy: "Value-led nurturing keeps you top of mind until the appraisal is booked." },
  { title: "Listing", copy: "You walk in as the agent they already know, and win the listing." },
];

const campaignCreative = [
  { src: "/images/campaign-creative/mary-pelican-2026.png", alt: "Pelican Waters property price campaign" },
  { src: "/images/campaign-creative/kael-castle-2025-2026.png", alt: "Castle Hill property price campaign" },
  { src: "/images/campaign-creative/mary-currimundi-worth-map.png", alt: "Currimundi home value campaign" },
];

function PhoneScreen({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <div className={styles.screenContent} key="ad">
        <span className={styles.screenEyebrow}>Local property update</span>
        <h3>What&apos;s your home worth?</h3>
        <p>See what recent buyer activity could mean for your property.</p>
        <div className={styles.addressField}>
          <Search />
          <span>Enter your address...</span>
        </div>
        <button type="button" tabIndex={-1}>Get my update</button>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className={styles.screenContent} key="lead">
        <span className={styles.successIcon}><Check /></span>
        <span className={styles.screenEyebrow}>Enquiry received</span>
        <h3>Meet your new seller lead.</h3>
        <p>Their details are captured and the first conversation is ready to begin.</p>
        <div className={styles.leadCard}>
          <span className={styles.avatar}>SM</span>
          <span><small>Sarah Mitchell</small><strong>6 Fort Street, Buderim</strong></span>
          <i>New</i>
        </div>
        <button type="button" tabIndex={-1}>Open enquiry</button>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className={`${styles.screenContent} ${styles.conversationScreen}`} key="appraisal">
        <div className={styles.conversationHead}>
          <span className={styles.avatar}>SM</span>
          <span><strong>Sarah Mitchell</strong><small>Seller enquiry</small></span>
          <i>Active</i>
        </div>
        <div className={`${styles.message} ${styles.messageAgent}`}>Would you prefer a rough price guide or a more accurate appraisal?</div>
        <div className={`${styles.message} ${styles.messageOwner}`}>An appraisal would be great.</div>
        <div className={styles.bookingCard}>
          <CalendarCheck />
          <span><small>Appraisal booked</small><strong>Thu 30 Oct · 10:30am</strong><em>6 Fort Street, Buderim</em></span>
        </div>
        <button type="button" tabIndex={-1}>View appointment</button>
      </div>
    );
  }

  return (
    <div className={styles.screenContent} key="listing">
      <span className={`${styles.successIcon} ${styles.listingIcon}`}><Home /></span>
      <span className={styles.screenEyebrow}>Opportunity won</span>
      <h3>Listing secured.</h3>
      <p>The homeowner already knows who to call when they are ready to sell.</p>
      <div className={styles.listingCard}>
        <span><small>Signed listing</small><strong>6 Fort Street, Buderim</strong></span>
        <Check />
      </div>
      <button type="button" tabIndex={-1}>View opportunity</button>
    </div>
  );
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

  const progressStyle = { "--journey-progress": `${active / 3}` } as CSSProperties;

  return (
    <section ref={root} className={styles.journey} aria-label="How an ad becomes a listing">
      <div className={styles.sticky}>
        <ol className={styles.timeline} style={progressStyle}>
          {stages.map((stage, index) => {
            const state = index < active ? styles.complete : index === active ? styles.current : "";
            return (
              <li key={stage.title} className={state} aria-current={index === active ? "step" : undefined}>
                <span>{index < active ? <Check /> : index + 1}</span>
                <div><h3>{stage.title}</h3><p>{stage.copy}</p></div>
              </li>
            );
          })}
        </ol>

        <div className={styles.mobileStage} key={stages[active].title}>
          <h3>{stages[active].title}</h3>
          <p>{stages[active].copy}</p>
        </div>

        <div className={`${styles.stage} ${styles[`stage${active}`]}`}>
          <div className={styles.stageLabel}><span>THE SELLER JOURNEY</span><strong>0{active + 1} / 04</strong></div>

          <div className={styles.creativeFan} aria-hidden="true">
            {campaignCreative.map((creative, index) => (
              <div className={styles.creativeCard} key={creative.src}>
                <Image src={creative.src} alt={creative.alt} fill sizes="220px" priority={index === 0} />
              </div>
            ))}
          </div>

          <div className={styles.phone}>
            <i />
            <div className={styles.phoneScreen} aria-live="polite"><PhoneScreen stage={active} /></div>
          </div>

          <div className={styles.notifications} aria-hidden="true">
            <div className={styles.noticeLead}><span><UserRound /></span><p><small>New seller lead</small><strong>6 Fort Street, Buderim</strong></p></div>
            <div className={styles.noticeConversation}><span><MessageCircle /></span><p><small>Conversation active</small><strong>Appraisal requested</strong></p></div>
            <div className={styles.noticeAppraisal}><span>SM</span><p><small>Appraisal booked</small><strong>Thu 30 Oct · 10:30am</strong></p></div>
            <div className={styles.noticeListing}><span><Home /></span><p><small>Listing signed</small><strong>6 Fort Street, Buderim</strong></p></div>
          </div>

          <div className={styles.systemRail} aria-hidden="true">
            <span className={active >= 0 ? styles.railOn : ""}>Campaign</span>
            <span className={active >= 1 ? styles.railOn : ""}>CRM</span>
            <span className={active >= 2 ? styles.railOn : ""}>Calendar</span>
            <span className={active >= 3 ? styles.railOn : ""}>Pipeline</span>
          </div>
        </div>
      </div>
    </section>
  );
}
