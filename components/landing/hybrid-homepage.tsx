import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { AuthoritySection } from "@/components/landing/authority-section";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { Navigation } from "@/components/landing/navigation";
import { SellerPathsSection, SellerProofSection } from "@/components/landing/seller-pipeline-sections";
import { SystemJourney } from "@/components/landing/system-journey";
import { discoveryCtaLabel } from "@/lib/funnel-offer";
import styles from "./hybrid-homepage.module.css";

const creativeTiles = [
  ["/images/video/vendor-audit-poster.jpg", "Seller campaign creative"],
  ["/images/seller-pipeline/meta-dashboard.png", "Campaign reporting"],
  ["/images/seller-pipeline/ai-conversation.png", "Seller conversation"],
  ["/images/seller-pipeline/seller-appraisal-growth-plan.png", "Appraisal growth plan"],
  ["/images/seller-pipeline/future-seller.png", "Future seller nurture"],
  ["/images/seller-pipeline/client-result.png", "Client result"],
];

const clientSlides = [
  { name:"Mary-Ann McLoughlin", area:"Sunshine Coast, QLD", image:"/images/showcase/mary-ann-results.png", stat:"Seller pipeline", detail:"Campaign, conversation and follow-up working as one system." },
  { name:"Kael Sharp", area:"Castle Hill, NSW", image:"/images/seller-pipeline/ai-conversation.png", stat:"Appraisal journey", detail:"Fast response and a clear route from enquiry to booking." },
  { name:"Shana Feng", area:"Brisbane, QLD", image:"/images/showcase/suburb-search-opportunity-light.png", stat:"Local opportunity", detail:"A considered system shaped around the agent and their market." },
];

const leadEvents = [
  ["SM","New seller enquiry","2 Kinane St, Brighton"],
  ["JR","Appraisal booked","18 Stanhill Dr, Palm Beach"],
  ["KP","Rough guide requested","12 High Cres, New Farm"],
  ["TW","Conversation started","6 Fort Street, Buderim"],
  ["AL","Future seller nurtured","13 Birrel Street, Bondi"],
  ["DK","Appraisal time offered","9 Harbour Rd, Hamilton"],
];

export function HybridHomepage({ structuredData }: { structuredData: unknown }) {
  return <div className={styles.shell}>
    <Navigation />
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}} />
      <HeroSection />
      <CtaSection />
      <LogoCarousel />

      <section id="system" className={styles.systemSection}>
        <div className={styles.mechanismHead}>
          <span>How it works</span>
          <h2>From attention to appraisal to signed listing.</h2>
          <p>One connected system moves a homeowner from first enquiry to the next useful action.</p>
        </div>
        <SystemJourney />
      </section>

      <section className={styles.creativeSection}>
        <header className={styles.centredHead}>
          <span>Creative</span>
          <h2>Creative that stops the scroll</h2>
          <p>Campaign, conversation and conversion assets designed together for the seller journey.</p>
        </header>
        <div className={styles.creativeViewport}>
          <div className={styles.creativeTrack}>
            {[...creativeTiles,...creativeTiles].map(([src,label],i)=><figure key={src+i}>
              <Image src={src} alt={i<creativeTiles.length?label:""} aria-hidden={i>=creativeTiles.length} width={950} height={950} />
            </figure>)}
          </div>
        </div>
      </section>

      <SellerPathsSection />
      <SellerProofSection />

      <section id="clients" className={styles.clientsSection}>
        <header className={styles.centredHead}>
          <span>Our clients</span>
          <h2>Agents growing with Arcanium</h2>
          <p>Seller pipeline systems built around real agents, real markets and a clear next step.</p>
        </header>
        <div className={styles.clientShowcase}>
          <div className={styles.clientPanels}>
            {clientSlides.map((client,i)=><article key={client.name} className={i===0?styles.clientActive:""}>
              <p><strong>{client.name}</strong><span>{client.area}</span></p>
              <h3>{client.stat}</h3>
              <p>{client.detail}</p>
            </article>)}
          </div>
          <div className={styles.clientFrame}>
            {clientSlides.map((client,i)=><Image key={client.name} className={i===0?styles.frameActive:""} src={client.image} alt={client.name+" seller pipeline system"} width={1152} height={768} />)}
          </div>
        </div>
      </section>

      <AuthoritySection />

      <section className={styles.ctaOuter}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaCopy}>
            <h2>Ready for more seller conversations?</h2>
            <p>Book a free discovery call and see what a campaign could look like in your market.</p>
            <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - LeadFleet CTA" className={styles.ctaButton}>
              {discoveryCtaLabel}<ArrowRight aria-hidden="true" />
            </MetaTrackedLink>
          </div>
          <div className={styles.eventViewport} aria-label="Illustrative seller journey events">
            <div className={styles.eventTrack}>
              {[...leadEvents,...leadEvents].map(([initials,event,address],i)=><span className={styles.eventChip} key={event+i} aria-hidden={i>=leadEvents.length}>
                <i>{initials}</i><b><small>{event}</small>{address}</b>
              </span>)}
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="pipeline-footer"><a href="#" aria-label="Arcanium Digital home">ARCANIUM DIGITAL</a><p>Seller enquiries. Real conversations. Clear next steps.</p><a href="/privacy">Privacy Policy</a></footer>
  </div>;
}
