import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { AuthoritySection } from "@/components/landing/authority-section";
import { ClientShowcase } from "@/components/landing/client-showcase";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { Navigation } from "@/components/landing/navigation";
import { SellerPathsSection, SellerProofSection } from "@/components/landing/seller-pipeline-sections";
import { SystemJourney } from "@/components/landing/system-journey";
import styles from "./hybrid-homepage.module.css";

const creativeTiles = [
  ["/images/video/vendor-audit-poster.jpg", "Seller campaign creative"],
  ["/images/seller-pipeline/meta-dashboard.png", "Campaign reporting"],
  ["/images/seller-pipeline/ai-conversation.png", "Seller conversation"],
  ["/images/showcase/mary-ann-results.png", "Seller campaign results"],
  ["/images/seller-pipeline/future-seller.png", "Future seller nurture"],
  ["/images/showcase/built-for-google-ai-search.png", "Digital presence creative"],
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
        <div className={styles.sectionHead}>
          <h2>From first attention to a booked appraisal.</h2>
          <p>One connected system gives every homeowner a clear next step.</p>
        </div>
        <SystemJourney />
      </section>

      <section className={styles.creativeSection}>
        <header className={styles.sectionHead}>
          <h2>Creative built for seller attention.</h2>
          <p>Campaign, conversation and conversion assets designed as one journey.</p>
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
        <header className={styles.sectionHead}>
          <h2>Built around the agent and their market.</h2>
          <p>Different markets. One disciplined path from enquiry to opportunity.</p>
        </header>
        <ClientShowcase />
      </section>

      <AuthoritySection />

      <section className={styles.ctaOuter}>
        <div className={styles.ctaPanel}>
          <h2>Ready for more seller conversations?</h2>
          <p>See what a focused campaign could look like in your market.</p>
          <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - final CTA" className={styles.ctaButton}>
            Book a free discovery call<ArrowRight aria-hidden="true" />
          </MetaTrackedLink>
        </div>
      </section>
    </main>
  </div>;
}
