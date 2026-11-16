import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
export function FinalCtaSection() {
  return <section className="mv-final mv-section mv-shell"><h2>Ready for More Appraisals?</h2><MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - final CTA" className="mv-button mv-primary-cta">See If You Qualify<svg className="mv-cta-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></MetaTrackedLink></section>;
}
