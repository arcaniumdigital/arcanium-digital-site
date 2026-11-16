"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleDot, Menu, MoveUpRight, X } from "lucide-react";
import styles from "./leadfleet-reference.module.css";

const brands = ["NEXT PROPERTY", "RAY WHITE", "ARCADIA", "NORTH & CO", "FOUND", "HOUSEMARK", "COASTAL", "PROPERTY PEOPLE"];

const steps = [
  { number: "01", title: "Ad", copy: "Scroll-stopping campaigns reach local owners where attention already lives." },
  { number: "02", title: "Lead", copy: "An owner checks their property value and the enquiry lands in one clear system." },
  { number: "03", title: "Appraisal", copy: "Fast, useful follow-up turns early curiosity into a genuine appraisal conversation." },
  { number: "04", title: "Listing", copy: "You walk in as the agent they already recognise, understand and trust." },
];

const clients = [
  { name: "Mary-Ann McLoughlin", market: "Sunshine Coast, QLD", image: "/images/testimonials/mary-ann-mcloughlin.jpg", sold: "Seller pipeline", days: "Always on" },
  { name: "Kael Sharp", market: "Castle Hill, NSW", image: "/images/testimonials/kael-sharp.jpg", sold: "Appraisal system", days: "24/7 follow-up" },
  { name: "Shana Feng", market: "Brisbane, QLD", image: "/images/testimonials/shana.jpg", sold: "Local authority", days: "Built to convert" },
  { name: "Next Property Group", market: "Sunshine Coast, QLD", image: "/images/showcase/mary-ann.png", sold: "Growth campaign", days: "Full funnel" },
];

const services = [
  { id: "001", title: "Social campaigns", tags: ["Hyperlocal", "Seller leads", "Brand authority"], image: "/images/showcase/mary-ann-strategy.png" },
  { id: "002", title: "Search campaigns", tags: ["Search intent", "Appraisals", "Tracking"], image: "/images/analytics/traffic-overview.jpg" },
  { id: "003", title: "Seller nurture", tags: ["Immediate reply", "AI setter", "Long-term value"], image: "/images/seller-pipeline/ai-conversation.png" },
  { id: "004", title: "Local search", tags: ["Suburb pages", "Reviews", "AI discovery"], image: "/images/showcase/built-for-google-ai-search.png" },
  { id: "005", title: "Conversion websites", tags: ["Premium design", "Appraisal funnels", "Personal brand"], image: "/images/seller-pipeline/service-overview.png" },
  { id: "006", title: "Campaign creative", tags: ["On brand", "Seller ads", "Listing ads"], image: "/images/video/vendor-audit-poster.jpg" },
];

const creative = ["/images/showcase/mary-ann-strategy.png", "/images/seller-pipeline/meta-dashboard.png", "/images/showcase/suburb-search-opportunity.png", "/images/seller-pipeline/ai-conversation.png", "/images/showcase/mary-ann-results.png", "/images/seller-pipeline/client-result.png"];
const websites = [
  { name: "Agent authority", label: "Personal brand website", image: "/images/showcase/mary-ann.png" },
  { name: "Seller pipeline", label: "Conversion landing experience", image: "/images/seller-pipeline/service-overview.png" },
  { name: "Local discovery", label: "Search and suburb content", image: "/images/showcase/built-for-google-ai-search.png" },
];
const events = ["New seller enquiry", "Appraisal requested", "Conversation started", "Price guide delivered", "Appraisal booked", "Listing opportunity"];
const faqs = [
  ["What kind of leads does the system create?", "Local homeowner enquiries from people interested in their property value, a price guide or an appraisal."],
  ["How does the campaign work?", "Ads create the initial attention, the landing experience captures the enquiry and structured follow-up keeps the conversation moving."],
  ["What happens after a lead arrives?", "The lead enters the CRM, receives a fast first response and is guided toward the most useful next step without losing future sellers."],
  ["Can this fit an existing real-estate brand?", "Yes. The system is designed to inherit the agent or agency identity while keeping the underlying conversion journey consistent."],
];

export function LeadFleetReference() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <div className={styles.site}>
    <header className={styles.nav}>
      <a className={styles.wordmark} href="#top" aria-label="Arcanium Digital home">ARCANIUM<span>DIGITAL</span></a>
      <nav aria-label="Reference site navigation"><a href="#system">How it works</a><a href="#clients">Clients</a><a href="#services">Services</a><a href="#creative">Creative</a></nav>
      <a className={styles.navCta} href="#contact">Book a call <MoveUpRight size={15} /></a><button className={styles.menu} aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu /></button>
    </header>
    <div className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`} aria-hidden={!menuOpen}>
      <div><a className={styles.wordmark} href="#top" onClick={closeMenu}>ARCANIUM<span>DIGITAL</span></a><button aria-label="Close menu" onClick={closeMenu}><X /></button></div>
      <nav aria-label="Mobile navigation"><a href="#system" onClick={closeMenu}>How it works</a><a href="#clients" onClick={closeMenu}>Clients</a><a href="#services" onClick={closeMenu}>Services</a><a href="#creative" onClick={closeMenu}>Creative</a><a href="#contact" onClick={closeMenu}>Book a discovery call <ArrowRight size={17}/></a></nav>
    </div>
    <main>
      <section id="top" className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true"><Image src="/images/seller-pipeline/founders-jordan-ollie.jpg" alt="" fill priority sizes="100vw" /></div><div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}><p className={styles.kicker}><CircleDot size={13} /> Seller pipeline systems for real estate agents</p><h1><span>More local sellers.</span><span>More booked appraisals.</span></h1><p className={styles.heroCopy}>Campaigns, conversion pages and intelligent follow-up that put you in front of homeowners before they choose an agent.</p><div className={styles.heroActions}><a className={styles.primary} href="#contact">Book a discovery call <ArrowRight size={16} /></a><a className={styles.secondary} href="#system">See how it works</a></div></div>
        <div className={styles.notifications} aria-label="Illustrative live lead events"><article><i>SM</i><div><strong>New seller enquiry</strong><span>Kellyville, NSW</span></div><small>now</small></article><article><i>AB</i><div><strong>Appraisal booked</strong><span>Castle Hill · Thu 2:00pm</span></div><small>now</small></article><article><i>MM</i><div><strong>Price guide requested</strong><span>Pelican Waters, QLD</span></div><small>now</small></article></div>
      </section>
      <section className={styles.brandStrip} aria-label="Illustrative client brands"><p>Built for ambitious Australian real-estate brands</p><div className={styles.marquee}><div>{[...brands, ...brands].map((brand, index) => <span key={`${brand}-${index}`}>{brand}</span>)}</div></div></section>
      <section className={styles.intro}><p className={styles.sectionLabel}>Introduction</p><h2>Attention is useful.<br />A system that converts it is better.</h2><p>We connect campaign creative, lead capture and seller follow-up into one consistent journey designed around appraisal conversations.</p></section>
      <section id="system" className={styles.system}>
        <div className={styles.sectionHead}><div><p className={styles.sectionLabel}>How it works</p><h2>How an ad becomes a listing.</h2></div><p>Every stage has one job: move the right homeowner towards a clear next step.</p></div>
        <div className={styles.stepGrid}>{steps.map(step => <article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p><div className={styles.stepLine}><i /></div></article>)}</div>
        <div className={styles.demoStage}><div className={styles.demoBrowser}><div className={styles.browserTop}><span /><span /><span /><p>seller-campaign.example</p></div><div className={styles.browserBody}><div className={styles.adCard}><small>Sponsored</small><h3>What could your home be worth today?</h3><p>Get a useful local price update in under a minute.</p><button>Check my property</button></div><div className={styles.phone}><div className={styles.phoneTop} /><p className={styles.smsIn}>Hi Sarah, would you prefer a rough price guide or a more accurate appraisal?</p><p className={styles.smsOut}>A rough guide please</p><p className={styles.smsIn}>Based on available property data, the rough estimate is around $1.42m.</p></div><div className={styles.booking}><span>Appraisal booked</span><strong>Thursday · 2:00pm</strong><p>Property visit confirmed</p><Check size={18} /></div></div></div></div>
      </section>
      <section id="clients" className={styles.clients}><div className={styles.sectionHead}><div><p className={styles.sectionLabel}>Our clients</p><h2>Agents building better seller pipelines.</h2></div><p>Campaigns and conversion systems built around each agent, market and growth goal.</p></div><div className={styles.clientScroller}>{clients.map(client => <article key={client.name}><div className={styles.clientImage}><Image src={client.image} alt={client.name} fill sizes="(max-width: 720px) 82vw, 31vw" /></div><div className={styles.clientBody}><p>{client.market}</p><h3>{client.name}</h3><dl><div><dt>{client.sold}</dt><dd>Focus</dd></div><div><dt>{client.days}</dt><dd>Coverage</dd></div></dl></div></article>)}</div></section>
      <section className={styles.metrics} aria-label="System outcomes"><div><strong>24/7</strong><span>Lead response</span></div><div><strong>&lt; 2 min</strong><span>Target first contact</span></div><div><strong>1 system</strong><span>From ad to appraisal</span></div><div><strong>Local</strong><span>Market positioning</span></div></section>
      <section className={styles.darkProcess}><div className={styles.processLead}><p className={styles.sectionLabel}>How we work</p><h2>Sellers decide before they enquire.</h2><p>The system shapes that decision from the first impression to the appraisal conversation.</p></div><div className={styles.processList}>{["Shape perception", "Capture demand", "Use every listing", "Nurture to appraisal"].map((title,index) => <article key={title}><span>0{index+1}</span><h3>{title}</h3><p>{steps[index].copy}</p></article>)}</div></section>
      <section id="services" className={styles.services}><div className={styles.sectionHead}><div><p className={styles.sectionLabel}>Services</p><h2>Growth tools that work together.</h2></div><p>Each module can stand alone, but the strongest experience connects them end to end.</p></div><div className={styles.serviceGrid}>{services.map(service => <article key={service.id}><header><span>({service.id})</span><h3>{service.title}</h3></header><ul>{service.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><div className={styles.serviceImage}><Image src={service.image} alt="" fill sizes="(max-width: 800px) 94vw, 46vw" /></div></article>)}</div></section>
      <section className={styles.testimonial}><div className={styles.testimonialImage}><Image src="/images/testimonials/kael-sharp.jpg" alt="Kael Sharp" fill sizes="(max-width: 800px) 100vw, 46vw" /></div><blockquote><span>Our approach</span><p>“Make the next step obvious for the homeowner and simple for the agent.”</p><footer><strong>Built for appraisal conversations</strong><small>Campaign, response, nurture and booking in one journey</small></footer></blockquote></section>
      <section className={styles.compare}><div className={styles.sectionHead}><div><p className={styles.sectionLabel}>Compare</p><h2>A complete system, not disconnected tactics.</h2></div><p>Use this table pattern to make the commercial difference easy to understand.</p></div><div className={styles.table} role="table" aria-label="Service comparison"><div className={styles.tableHead} role="row"><span>Capability</span><strong>Arcanium</strong><span>In-house</span><span>General agency</span></div>{["Real-estate specialist", "Campaign creative", "Seller lead capture", "Immediate follow-up", "Appraisal booking", "Long-term nurture", "Reporting and optimisation"].map((item,index) => <div role="row" key={item}><span>{item}</span><strong><Check size={16}/> Yes</strong><span>{index<2?"Yes":"Varies"}</span><span>{index===1||index===6?"Yes":"Varies"}</span></div>)}</div></section>
      <section id="creative" className={styles.creativeSection}><div className={styles.sectionHead}><div><p className={styles.sectionLabel}>Creative</p><h2>Creative that stops the scroll.</h2></div><p>A moving campaign wall built from approved Arcanium assets.</p></div><div className={styles.creativeRail}><div>{[...creative,...creative].map((src,index)=><figure key={`${src}-${index}`}><Image src={src} alt="Arcanium campaign creative" fill sizes="360px" /></figure>)}</div></div></section>
      <section className={styles.websites}><div className={styles.sectionHead}><div><p className={styles.sectionLabel}>Web experiences</p><h2>Websites built to create action.</h2></div><p>Clear positioning, useful content and focused conversion journeys for agents who want more than a digital brochure.</p></div><div className={styles.websiteGrid}>{websites.map((website,index)=><article key={website.name}><div><span>0{index+1}</span><p>{website.label}</p></div><h3>{website.name}</h3><figure><Image src={website.image} alt={website.name} fill sizes="(max-width: 700px) 92vw, 31vw" /></figure></article>)}</div></section>
      <section id="contact" className={styles.cta}><div><p className={styles.sectionLabel}>Next step</p><h2>Make the seller journey feel inevitable.</h2><p>Build a consistent path from local attention to genuine appraisal conversations.</p><a className={styles.primary} href="/#audit">Book a discovery call <ArrowRight size={16}/></a></div><div className={styles.eventTicker}><div>{[...events,...events].map((event,index)=><span key={`${event}-${index}`}><i/>{event}<small>now</small></span>)}</div></div></section>
      <section className={styles.faq}><div><p className={styles.sectionLabel}>FAQ</p><h2>Questions agents ask.</h2></div><div>{faqs.map(([question,answer],index)=><details key={question} open={index===0}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className={styles.footer}><a className={styles.wordmark} href="#top">ARCANIUM<span>DIGITAL</span></a><p>Seller pipeline systems for Australian real estate agents.</p><a href="/">Main website</a></footer>
  </div>;
}
