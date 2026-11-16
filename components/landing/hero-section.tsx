import { HeroVideo } from "./hero-video";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

export function HeroSection() {
  return <section id="vsl" className="mv-hero mv-shell">
    <div className="mv-hero-copy">
      <h1>We Guarantee Your First On Site Appraisal <span>Within 7 Days.</span> Or You Don&apos;t Pay.</h1>
      <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - hero" className="mv-button mv-primary-cta">See If You Qualify<svg className="mv-cta-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></MetaTrackedLink>
    </div>
    <div className="mv-video"><HeroVideo /></div>
    <p className="mv-video-description">We generate local seller enquiries through Meta Ads, follow up with AI and book ready homeowners directly into your calendar.</p>
  </section>;
}
