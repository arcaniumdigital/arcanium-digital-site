import Image from "next/image";
import { ArrowDown, ArrowRight, Check, Clock3, CalendarCheck, MessageCircle, RefreshCw, Search, Target, Zap, ChartNoAxesCombined, Users, Phone, Mail } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { PipelineFormCta } from "@/components/landing/pipeline-form-cta";

const assets = "/images/seller-pipeline";

export function LeadComparisonSection() {
  const paths = [
    { name: "Lead delivery only", label: "The usual hand-off", steps: ["Seller enquiry arrives", "Agent follows up when available", "Homeowner doesn’t answer", "Other work takes priority", "Potential listing opportunity goes cold"], end: "The follow-up is left to you.", active: false },
    { name: "Arcanium", label: "The follow-through", steps: ["Local homeowner enquiry arrives", "Immediate AI response", "Seller intent is qualified", "Appointment booked or nurture begins", "Every homeowner has a next step"], end: "Every homeowner has a next step.", active: true },
  ];
  const icons = [Users, Zap, MessageCircle, CalendarCheck, RefreshCw];
  return <section id="the-difference" className="pipeline-section pipeline-dark">
    <div className="pipeline-container">
      <div data-motion="keyword" className="pipeline-heading"><h2>How Many Potential Listings Are <span className="motion-keyword">Slipping</span> <span className="pipeline-soft">Through the Cracks?</span></h2><p>You spend money generating seller enquiries. But what happens when those homeowners don’t answer the first call, aren’t ready to sell today, or simply get forgotten between appointments?</p></div>
      <div className="pipeline-comparison">
        {paths.map((path) => <article data-motion="comparison" key={path.name} className={`pipeline-path ${path.active ? "pipeline-path-active" : ""}`}>
          <div className="pipeline-path-title"><div><p>{path.label}</p><h3>{path.name}</h3></div>{path.active ? <span className="pipeline-mini-badge">Managed for you</span> : <Mail size={24} aria-hidden="true" />}</div>
          <ol>{path.steps.map((step, index) => { const Icon = icons[index]; return <li key={step}><div className="pipeline-flow-row"><span className="pipeline-flow-icon">{path.active ? <Icon size={19} aria-hidden="true" /> : <span>0{index + 1}</span>}</span><span>{step}</span>{path.active && index === 4 && <Check size={18} className="ml-auto text-[#65d9bb]" aria-hidden="true" />}</div>{index < path.steps.length - 1 && <ArrowDown className="pipeline-flow-arrow" size={16} aria-hidden="true" />}</li>; })}</ol>
          <p className="pipeline-path-end">{path.end}</p>
        </article>)}
      </div>
      <p className="mt-8 max-w-[650px] text-base leading-[1.75] text-[#aaaab2]">The next seller who enquires might not be ready today. Will you still be in the conversation when they are?</p>
      <PipelineFormCta
        title="Explore the five-step system in your free 8-page growth guide."
        buttonLabel="Get My Free Growth Guide + Strategy Call"
        trackingLabel="Seller Pipeline Audit - lead comparison"
      />
    </div>
  </section>;
}

export function SellerSystemSection() {
  const stages = [
    { title: "We generate.", description: "Local homeowners enquire through your Meta campaigns.", Icon: Target, detail: "New seller enquiry" },
    { title: "We qualify.", description: "AI starts the conversation and identifies intent and timing.", Icon: MessageCircle, detail: "Intent identified" },
    { title: "We book.", description: "Ready sellers are guided toward an appraisal appointment.", Icon: CalendarCheck, detail: "Appraisal booked" },
    { title: "You show up.", description: "You handle the appraisal, the relationship and the listing conversation.", Icon: Users, detail: "Your next conversation" },
  ];
  return <section id="how-it-works" className="pipeline-section pipeline-light">
    <div className="pipeline-container">
      <div data-motion="keyword" className="pipeline-heading"><p className="process-eyebrow">Your seller pipeline, connected</p><h2>One enquiry.<br /><span className="motion-keyword pipeline-purple">A clear next step.</span></h2></div>
      <div className="process-graphic">
        <div className="process-graphic-top"><span><span className="process-live-dot" /> The Arcanium system</span><span>Illustrative workflow</span></div>
        <ol className="process-steps">
          {stages.map(({ title, description, Icon, detail }, index) => <li data-motion="process" className="process-step" key={title}>
            <div className="process-step-top"><span className="process-node"><Icon size={27} strokeWidth={1.5} aria-hidden="true" /></span><span className="process-number">0{index + 1}</span></div>
            <div className="process-connector" aria-hidden="true"><span /></div>
            <h3>{title}</h3><p>{description}</p><span className="process-outcome"><Check size={13} aria-hidden="true" />{detail}</span>
          </li>)}
        </ol>
        <div data-motion="nurture" className="process-nurture"><span className="process-nurture-icon"><RefreshCw size={22} aria-hidden="true" /></span><div><h3>Not ready yet? The follow-up continues.</h3><p>33-touch nurture keeps future sellers in reach until their timing changes.</p></div><span className="process-nurture-path" aria-hidden="true"><span /></span><span className="process-nurture-label">Back into the conversation <ArrowRight size={15} aria-hidden="true" /></span></div>
      </div>
      <PipelineFormCta
        title="See how this system could fit your agency."
        buttonLabel="Get My Free Growth Guide + Strategy Call"
        trackingLabel="Seller Pipeline Audit - system overview"
        variant="light"
      />
    </div>
  </section>;
}

export function SellerPathsSection() {
  return <section id="seller-paths" className="pipeline-section pipeline-dark">
    <div className="pipeline-container">
      <div data-motion="keyword" className="pipeline-heading"><h2>Not Every Homeowner{" "}<br />Is Ready <span className="pipeline-purple motion-keyword">Today.</span></h2></div>
      <div data-motion="branch" className="pipeline-branch"><span><MessageCircle size={17} aria-hidden="true" /> Homeowner enquiry</span><div aria-hidden="true" /></div>
      <div className="pipeline-two-paths">
        <article className="pipeline-intent-card"><div className="pipeline-intent-heading"><span className="pipeline-status"><span /> Ready for a conversation</span><h3>Turn intent into a next step.</h3><p>Identify intent. Offer an appointment. Work toward a booked appraisal.</p></div><figure><Image src={`${assets}/ai-conversation.png`} alt="Illustrative AI conversation: Sarah is considering selling in the next few months, accepts an appraisal offer and is offered appointment times." width={1254} height={1254} sizes="(max-width: 760px) 94vw, 580px" quality={78} /><figcaption>Illustrative conversation. Appointment times offered.</figcaption></figure><div className="pipeline-intent-footer"><CalendarCheck size={19} aria-hidden="true" /><p>A clear path to the appraisal conversation.</p></div></article>
        <article className="pipeline-intent-card"><div className="pipeline-intent-heading"><span className="pipeline-status pipeline-status-later"><span /> Ready later</span><h3>Keep future sellers in reach.</h3><p>Identify future timing. Enter 33-touch nurture. Requalify when plans change.</p></div><figure><Image src={`${assets}/future-seller.png`} alt="Illustrative low-intent conversation followed by a 33-touch nurture plan with market updates, seller education, local sales and check-ins." width={1254} height={1254} sizes="(max-width: 760px) 94vw, 580px" quality={78} /><figcaption>Illustrative conversation and future seller nurture plan.</figcaption></figure><div className="pipeline-intent-footer"><RefreshCw size={19} aria-hidden="true" /><p>Not ready today does not mean forgotten tomorrow.</p></div></article>
      </div>
    </div>
  </section>;
}

export function SellerProofSection() {
  return <section id="proof" className="pipeline-section pipeline-light">
    <div className="pipeline-container">
      <div className="pipeline-heading"><h2>Here’s What The System{" "}<br />Looks Like <span className="pipeline-purple">In Practice.</span></h2></div>
      <div data-motion="proof" className="pipeline-proof-grid">
        <article className="pipeline-proof-card"><div className="pipeline-card-heading"><span className="pipeline-icon-box"><ChartNoAxesCombined size={22} aria-hidden="true" /></span><div><h3>Real Meta campaign.</h3></div></div>
          <div className="pipeline-proof-image"><Image src={`${assets}/meta-dashboard.png`} alt="Meta Ads Manager: three campaigns, $768.22 total spend and 32 Meta leads during 4 September to 3 October 2026." width={1792} height={878} sizes="(max-width: 1280px) 94vw, 1140px" quality={78} /></div>
          <div className="pipeline-metrics"><div><strong>$768.22</strong><span>Total spend</span></div><div><strong>32</strong><span>Meta leads</span></div><div><strong>3</strong><span>Campaigns</span></div></div><p className="pipeline-evidence-note">Results shown are Meta lead enquiries, not confirmed appraisals or listings.</p>
        </article>
      </div>
    </div>
  </section>;
}

const auditAreas = [
  { title: "Lead Generation", description: "Where your seller enquiries come from.", Icon: Target },
  { title: "Speed-to-Lead", description: "How quickly a new enquiry hears from you.", Icon: Zap },
  { title: "Follow-Up", description: "What happens when someone does not answer.", Icon: Phone },
  { title: "Future Seller Nurture", description: "How future sellers and old database leads stay in reach.", Icon: RefreshCw },
  { title: "Appointment Booking", description: "How conversations become booked appraisals.", Icon: CalendarCheck },
  { title: "Tracking", description: "What you can see from enquiry to appraisal to listing.", Icon: Search },
];

export function PipelineAuditSection() {
  return <section id="free-audit" className="pipeline-section pipeline-light">
    <div className="pipeline-container pipeline-audit-layout">
      <div className="pipeline-heading"><h2>Turn More Seller Enquiries Into <span className="pipeline-purple">Appraisals.</span></h2><p>Explore our five-step system in the free 8-page Seller Appraisal Growth Guide, then discuss your lead generation, follow-up, nurture and booking process in a free 10–15-minute strategy call. No obligation.</p><ul className="pipeline-audit-points">{["Get the free 8-page growth guide", "Find the biggest gap in your pipeline", "Leave with a practical next step"].map(item => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul><MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - offer" className="pipeline-cta">Get My Free Growth Guide + Strategy Call <ArrowRight size={17} aria-hidden="true" /></MetaTrackedLink></div>
      <div className="pipeline-audit-panel"><div className="pipeline-audit-panel-top"><span><Clock3 size={16} aria-hidden="true" /> 10–15 minute strategy call</span><span>6 areas</span></div><div>{auditAreas.map(({ title, description, Icon }, index) => <article data-motion="audit-row" key={title}><span className="pipeline-icon-box"><Icon size={21} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div><span className="pipeline-audit-number">0{index + 1}</span></article>)}</div><p className="pipeline-audit-panel-bottom">Our system. Your pipeline. A practical next step.</p></div>
    </div>
  </section>;
}
