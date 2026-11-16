import { CampaignMetrics } from "./campaign-metrics";
import { SellerJourney } from "./seller-journey";
import { CampaignEvidence } from "./campaign-evidence";
export function SellerSystemSection() {
  return <section id="how-it-works" className="mv-section mv-shell"><h2>How It Works</h2><SellerJourney /></section>;
}
export function SellerProofSection() {
  return <section id="proof" className="mv-section mv-shell"><h2>Campaign Results</h2><div className="mv-results">
    <CampaignMetrics />
    <p className="mv-results-note">Campaign shown: 28 October to 10 November 2026. Results vary by market and campaign.</p>
    <CampaignEvidence />
  </div></section>;
}
