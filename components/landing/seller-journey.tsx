"use client";

import { useEffect, useRef } from "react";

export function SellerJourney() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    let played = false;
    element.dataset.motion = "pending";
    const observer = new IntersectionObserver(entries => {
      if (played || !entries.some(entry => entry.isIntersecting)) return;
      played = true;
      element.dataset.motion = "played";
      observer.disconnect();
    }, { threshold: 0.12 });
    const reduceMotion = () => {
      if (preference.matches) {
        element.dataset.motion = "reduced";
        played = true;
        observer.disconnect();
      }
    };
    observer.observe(element);
    preference.addEventListener("change", reduceMotion);
    return () => { observer.disconnect(); preference.removeEventListener("change", reduceMotion); delete element.dataset.motion; };
  }, []);

  return <div ref={root} className="mv-journey">
    <div className="mv-journey-flow">
      <article className="mv-journey-stage">
        <div className="mv-mini-ui mv-ad-ui" aria-label="Example Meta ad generating a homeowner enquiry">
          <div className="mv-ui-top"><span className="mv-meta-mark" aria-hidden="true">∞</span><span>Meta Ads</span><span className="mv-ui-status">Active</span></div>
          <div className="mv-mini-ad" aria-hidden="true"><svg viewBox="0 0 64 44" fill="none"><path d="M10 23 32 6l22 17M17 19v20h30V19M28 39V27h9v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg><div><span/><span/><span/></div></div>
          <div className="mv-ui-notice mv-enquiry"><span className="mv-ui-check" aria-hidden="true">✓</span><span>New homeowner enquiry</span><small>Just now</small></div>
        </div>
        <h3>Generate</h3><p>Meta Ads attract homeowners in your market.</p>
        <JourneyConnector stage="first" />
      </article>
      <article className="mv-journey-stage">
        <div className="mv-mini-ui mv-ai-ui" aria-label="Example AI qualification and seller routing">
          <div className="mv-ui-top"><span className="mv-ai-mark">AI</span><span>Seller conversation</span></div>
          <div className="mv-ai-message">When are you thinking of selling?</div>
          <div className="mv-ui-outcomes">
            <div className="mv-ui-ready"><strong>Ready to Sell</strong><span>Booking <span aria-hidden="true">→</span></span></div>
            <div className="mv-ui-future"><strong>Future Seller</strong><span>Ongoing nurture</span></div>
          </div>
        </div>
        <h3>Engage</h3><p>AI qualifies enquiries and nurtures future sellers.</p>
        <JourneyConnector stage="second" />
      </article>
      <article className="mv-journey-stage">
        <div className="mv-mini-ui mv-calendar-ui" aria-label="Example confirmed appraisal appointment">
          <div className="mv-ui-top"><span>Appraisal calendar</span><span className="mv-ui-status">This week</span></div>
          <div className="mv-mini-week" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => <div key={day} className={index === 2 ? "mv-selected-date" : undefined}><small>{day}</small><span>{12 + index}</span></div>)}</div>
          <div className="mv-ui-notice mv-booked"><span className="mv-ui-check" aria-hidden="true">✓</span><span>Appraisal booked</span><small>10:00 am</small></div>
        </div>
        <h3>Convert</h3><p>Ready sellers are booked into your calendar.</p>
      </article>
    </div>
    <p className="mv-journey-finish">You focus on winning the listing. We handle the follow up.</p>
  </div>;
}

function JourneyConnector({ stage }: { stage: "first" | "second" }) {
  return <svg className={`mv-software-connector mv-connector-${stage}`} viewBox="0 0 28 16" fill="none" aria-hidden="true"><path className="mv-connector-track" d="M0 8h26m-5-4 5 4-5 4"/><path className="mv-connector-signal" d="M0 8h26m-5-4 5 4-5 4"/></svg>;
}
