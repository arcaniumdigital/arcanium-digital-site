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

const clientCards = [
  {
    name: "Mary-Ann McLoughlin",
    market: "Sunshine Coast",
    image: "/images/testimonials/mary-ann-mcloughlin.jpg",
    quote: "A focus on the whole appraisal process, from the first seller enquiry through to follow-up and booking.",
  },
  {
    name: "Kael Sharp",
    market: "Sydney",
    image: "/images/testimonials/kael-sharp.jpg",
    quote: "Practical ideas, careful listening and a clear focus on outcomes.",
  },
  {
    name: "Shana Feng",
    market: "Brisbane",
    image: "/images/testimonials/shana.jpg",
    quote: "A considered, professional process built around what matters to the agent.",
  },
];

const journeyEvents = [
  "New seller enquiry",
  "Conversation started",
  "Rough guide requested",
  "Appraisal time offered",
  "Future seller nurtured",
  "Appraisal booked",
];

export function HybridHomepage({ structuredData }: { structuredData: unknown }) {
  return (
    <div className={styles.shell}>
      <Navigation />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <HeroSection />
        <CtaSection />
        <LogoCarousel />

        <section id="system" className={styles.systemSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <h2>Three moments that move a seller forward.</h2>
              <p>
                See how local attention becomes a homeowner conversation, a booked appraisal and a visible listing opportunity.
              </p>
            </div>
            <SystemJourney />
          </div>
        </section>

        <section className={styles.creativeSection}>
          <div className={styles.container}>
            <div className={styles.creativeHeading}>
              <h2>Creative that stops the scroll.</h2>
              <p>
                Campaign, conversation and conversion assets designed as one connected seller journey.
              </p>
            </div>
            <div className={styles.creativeGallery}>
              <figure>
                <Image
                  src="/images/video/vendor-audit-poster.jpg"
                  alt="Arcanium seller appraisal campaign video creative"
                  fill
                  sizes="(max-width: 800px) 94vw, 38vw"
                />
                <figcaption>Campaign creative</figcaption>
              </figure>
              <figure>
                <Image
                  src="/images/seller-pipeline/ai-conversation.png"
                  alt="Illustrative seller appraisal conversation"
                  fill
                  sizes="(max-width: 800px) 94vw, 28vw"
                />
                <figcaption>Seller conversation</figcaption>
              </figure>
              <figure>
                <Image
                  src="/images/seller-pipeline/meta-dashboard.png"
                  alt="Meta campaign performance dashboard"
                  fill
                  sizes="(max-width: 800px) 94vw, 28vw"
                />
                <figcaption>Transparent reporting</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <SellerPathsSection />
        <SellerProofSection />

        <section id="clients" className={styles.clientsSection}>
          <div className={styles.container}>
            <div className={styles.clientsHeading}>
              <h2>Agents building a better seller pipeline.</h2>
              <p>Real estate professionals working with Arcanium across Australia.</p>
            </div>
            <div className={styles.clientCards}>
              {clientCards.map((client) => (
                <article key={client.name}>
                  <Image
                    src={client.image}
                    alt={client.name}
                    width={680}
                    height={760}
                    sizes="(max-width: 800px) 94vw, 31vw"
                  />
                  <div>
                    <span>{client.market}</span>
                    <h3>{client.name}</h3>
                    <p>{client.quote}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <AuthoritySection />

        <section className={styles.leadBand}>
          <div className={styles.container}>
            <h2>Ready for more appraisal conversations?</h2>
            <p>Book a free discovery call and see how the system could work in your market.</p>
            <MetaTrackedLink
              href="#audit"
              trackingLabel="Seller Pipeline Audit - event band"
              className={styles.primaryButton}
            >
              {discoveryCtaLabel}
              <ArrowRight aria-hidden="true" />
            </MetaTrackedLink>
          </div>
          <p className={styles.eventLabel}>Illustrative seller journey</p>
          <div className={styles.eventViewport}>
            <div className={styles.eventTrack}>
              {[...journeyEvents, ...journeyEvents].map((event, index) => (
                <span key={event + "-" + index}>
                  <i />
                  {event}
                  <small>now</small>
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="pipeline-footer">
        <a href="#" aria-label="Arcanium Digital home">ARCANIUM DIGITAL</a>
        <p>Seller enquiries. Real conversations. Clear next steps.</p>
        <a href="/privacy">Privacy Policy</a>
      </footer>
    </div>
  );
}
