import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { AuthoritySection } from "@/components/landing/authority-section";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroVideo } from "@/components/landing/hero-video";
import { Navigation } from "@/components/landing/navigation";
import { SellerPathsSection, SellerProofSection } from "@/components/landing/seller-pipeline-sections";
import { SystemJourney } from "@/components/landing/system-journey";
import styles from "./hybrid-homepage.module.css";

const clientNames = ["Mary-Ann McLoughlin", "Kael Sharp", "Shana Feng", "Next Property Group", "Ray White Castle Hill"];

const clientCards = [
  { name: "Mary-Ann McLoughlin", market: "Sunshine Coast", image: "/images/testimonials/mary-ann-mcloughlin.jpg", quote: "A focus on the whole appraisal process, from the first seller enquiry through to follow-up and booking." },
  { name: "Kael Sharp", market: "Sydney", image: "/images/testimonials/kael-sharp.jpg", quote: "Practical ideas, careful listening and a clear focus on outcomes." },
  { name: "Shana Feng", market: "Brisbane", image: "/images/testimonials/shana.jpg", quote: "A considered, professional process built around what matters to the agent." },
];

const journeyEvents = ["New seller enquiry", "Conversation started", "Rough guide requested", "Appraisal time offered", "Future seller nurtured", "Appraisal booked"];

export function HybridHomepage({ structuredData }: { structuredData: unknown }) {
  return (
    <div className={styles.shell}>
      <Navigation />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

        <section id="vsl" className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.container}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Seller pipeline systems for real estate agents</p>
              <h1>Your first on-site appraisal booked in 7 days.<span>Three more within the month. Or you don&apos;t pay.</span></h1>
              <p>Meta campaigns, immediate follow-up and seller nurture working together to create more appraisal conversations.</p>
              <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - hybrid hero" className={styles.primaryButton}>
                Book your free discovery call <ArrowRight aria-hidden="true" />
              </MetaTrackedLink>
            </div>
            <div className={styles.videoBox}>
              <HeroVideo />
              <div className={styles.heroNotice}><span /><div><strong>New seller enquiry</strong><small>Conversation ready to begin</small></div></div>
            </div>
          </div>
        </section>

        <section className={styles.logoMarquee} aria-label="Agents and agencies working with Arcanium">
          <p>Built alongside ambitious Australian agents</p>
          <div className={styles.marqueeViewport}>
            <div className={styles.marqueeTrack}>
              {[...clientNames, ...clientNames].map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}
            </div>
          </div>
        </section>

        <CtaSection />

        <section id="system" className={styles.systemSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>From first scroll to signed listing</p>
              <h2>Three moments that move a seller forward.</h2>
              <p>Custom AgentEA-inspired motion shows how local attention becomes a homeowner conversation, a booked appraisal and a listing opportunity.</p>
            </div>
            <SystemJourney />
          </div>
        </section>

        <section className={styles.creativeSection}>
          <div className={styles.container}>
            <div className={styles.creativeHeading}>
              <p className={styles.eyebrow}>Creative</p>
              <h2>Creative that stops the scroll.</h2>
              <p>Campaign, conversation and conversion assets designed as one connected seller journey.</p>
            </div>
            <div className={styles.creativeGallery}>
              <figure className={styles.creativeTall}><Image src="/images/video/vendor-audit-poster.jpg" alt="Arcanium seller appraisal campaign video creative" fill sizes="(max-width: 800px) 94vw, 38vw" /><figcaption>Campaign creative</figcaption></figure>
              <figure><Image src="/images/seller-pipeline/ai-conversation.png" alt="Illustrative seller appraisal conversation" fill sizes="(max-width: 800px) 94vw, 28vw" /><figcaption>Seller conversation</figcaption></figure>
              <figure><Image src="/images/seller-pipeline/meta-dashboard.png" alt="Meta campaign performance dashboard" fill sizes="(max-width: 800px) 94vw, 28vw" /><figcaption>Transparent reporting</figcaption></figure>
            </div>
          </div>
        </section>

        <SellerPathsSection />
        <SellerProofSection />

        <section id="clients" className={styles.clientsSection}>
          <div className={styles.container}>
            <div className={styles.clientsHeading}><p className={styles.eyebrow}>Our clients</p><h2>Agents building a better seller pipeline.</h2><p>Real estate professionals working with Arcanium across Australia.</p></div>
            <div className={styles.clientCards}>
              {clientCards.map((client) => (
                <article key={client.name}>
                  <Image src={client.image} alt={client.name} width={680} height={760} sizes="(max-width: 800px) 94vw, 31vw" />
                  <div><span>{client.market}</span><h3>{client.name}</h3><p>{client.quote}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <AuthoritySection />

        <section className={styles.leadBand}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>The enquiry is only the beginning</p>
            <h2>Ready for more appraisal conversations?</h2>
            <p>Book a free discovery call and see how the system could work in your market.</p>
            <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - event band" className={styles.primaryButton}>Book your free discovery call <ArrowRight aria-hidden="true" /></MetaTrackedLink>
          </div>
          <p className={styles.eventLabel}>Illustrative journey events</p>
          <div className={styles.eventViewport}>
            <div className={styles.eventTrack}>{[...journeyEvents, ...journeyEvents].map((event, index) => <span key={`${event}-${index}`}><i />{event}<small>now</small></span>)}</div>
          </div>
        </section>
      </main>
      <footer className="pipeline-footer"><a href="#" aria-label="Arcanium Digital home">ARCANIUM DIGITAL</a><p>Seller enquiries. Real conversations. Clear next steps.</p><a href="/privacy">Privacy Policy</a></footer>
    </div>
  );
}

