import Image from "next/image";
import { ArrowDown, ArrowRight, Check, Clock3, CalendarCheck, MessageCircle, RefreshCw, Search, Target, Zap, ChartNoAxesCombined, Users, Phone, Mail } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

const assets = "/images/seller-pipeline";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="pipeline-label"><span />{children}</p>;
}

export function LeadComparisonSection() {
  const paths = [
    { name: "Lead delivery only", label: "The usual hand-off", steps: ["Facebook lead", "Lead notification", "Agent follows up when they can", "No answer", "Lead disappears"], end: "The follow-up is left to you.", active: false },
    { name: "Arcanium", label: "The follow-through", steps: ["Homeowner enquiry", "Instant response", "AI qualification", "Appointment or nurture", "Seller stays in the pipeline"], end: "Every homeowner has a next step.", active: true },
  ];
  const icons = [Users, Zap, MessageCircle, CalendarCheck, RefreshCw];
  return <section id="the-difference" className="pipeline-section pipeline-dark">
    <div className="pipeline-container">
      <div className="pipeline-heading"><SectionLabel>The missing piece</SectionLabel><h2>Getting the lead is{" "}<br /><span className="pipeline-soft">only the first step.</span></h2><p>The real opportunity is what happens after someone enquires.</p></div>
      <div className="pipeline-comparison">
        {paths.map((path) => <article key={path.name} className={`pipeline-path ${path.active ? "pipeline-path-active" : ""}`}>
          <div className="pipeline-path-title"><div><p>{path.label}</p><h3>{path.name}</h3></div>{path.active ? <span className="pipeline-mini-badge">Managed for you</span> : <Mail size={24} aria-hidden="true" />}</div>
          <ol>{path.steps.map((step, index) => { const Icon = icons[index]; return <li key={step}><div className="pipeline-flow-row"><span className="pipeline-flow-icon">{path.active ? <Icon size={19} aria-hidden="true" /> : <span>0{index + 1}</span>}</span><span>{step}</span>{path.active && index === 4 && <Check size={18} className="ml-auto text-[#65d9bb]" aria-hidden="true" />}</div>{index < path.steps.length - 1 && <ArrowDown className="pipeline-flow-arrow" size={16} aria-hidden="true" />}</li>; })}</ol>
          <p className="pipeline-path-end">{path.end}</p>
        </article>)}
      </div>
    </div>
  </section>;
}

const stages = [
  { title: "We generate the leads.", body: "Meta campaigns create local homeowner enquiries.", Icon: Target },
  { title: "We qualify the lead.", body: "AI starts the conversation and identifies selling intent and timing.", Icon: MessageCircle },
  { title: "We book the appraisal.", body: "Ready sellers are guided toward available appointment times.", Icon: CalendarCheck },
  { title: "You show up.", body: "You handle the appraisal, the relationship and the listing conversation.", Icon: Users },
];

export function SellerSystemSection() {
  return <section id="how-it-works" className="pipeline-section pipeline-light">
    <div className="pipeline-container">
      <div className="pipeline-heading"><SectionLabel>Your seller pipeline, connected</SectionLabel><h2>We Generate. We Qualify.{" "}<br />We Book. <span className="pipeline-purple">You Show Up.</span></h2><p>One connected journey from the first enquiry to the next conversation.</p></div>
      <figure className="pipeline-overview"><Image src={`${assets}/service-overview.png`} alt="Four-step Arcanium service overview: generate homeowner enquiries, qualify intent, book an appraisal and attend. Homeowners who are not ready enter 33-touch nurture." width={1536} height={1024} sizes="(max-width: 1280px) 94vw, 1200px" quality={78} /><figcaption>How the system works. Illustrative workflow.</figcaption></figure>
      <div className="pipeline-stages">{stages.map(({ title, body, Icon }, index) => <article key={title}><div className="pipeline-stage-top"><span>0{index + 1}</span><Icon size={22} aria-hidden="true" /></div><h3>{title}</h3><p>{body}</p></article>)}</div>
      <div className="pipeline-cycle"><RefreshCw size={19} aria-hidden="true" /><span>New enquiries. Better conversations. <strong>Cycle repeats.</strong></span></div>
    </div>
  </section>;
}

export function SellerPathsSection() {
  return <section id="seller-paths" className="pipeline-section pipeline-dark">
    <div className="pipeline-container">
      <div className="pipeline-heading"><SectionLabel>Timing changes. The follow-up continues.</SectionLabel><h2>Not Every Homeowner{" "}<br />Is Ready <span className="pipeline-purple">Today.</span></h2><p>That’s why every enquiry takes one of two paths.</p></div>
      <div className="pipeline-branch"><span><MessageCircle size={17} aria-hidden="true" /> Homeowner enquiry</span><div aria-hidden="true" /></div>
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
      <div className="pipeline-heading"><SectionLabel>A closer look</SectionLabel><h2>Here’s What The System{" "}<br />Looks Like <span className="pipeline-purple">In Practice.</span></h2><p>A closer look at real campaign activity and homeowner enquiries.</p></div>
      <div className="pipeline-proof-grid">
        <article className="pipeline-proof-card"><div className="pipeline-card-heading"><span className="pipeline-icon-box"><ChartNoAxesCombined size={22} aria-hidden="true" /></span><div><p>Seller acquisition</p><h3>Real Meta campaign.</h3></div></div><p className="pipeline-card-description">Kael Sharp’s campaign snapshot, 4 September to 3 October 2026.</p>
          <div className="pipeline-proof-image"><Image src={`${assets}/meta-dashboard.png`} alt="Meta Ads Manager: three campaigns, $768.22 total spend and 32 Meta leads during 4 September to 3 October 2026." width={1792} height={878} sizes="(max-width: 1280px) 94vw, 1140px" quality={78} /></div>
          <div className="pipeline-metrics"><div><strong>$768.22</strong><span>Total spend</span></div><div><strong>32</strong><span>Meta leads</span></div><div><strong>3</strong><span>Campaigns</span></div></div><p className="pipeline-evidence-note">Results shown are Meta lead enquiries, not confirmed appraisals or listings.</p>
        </article>
      </div>
      <div className="pipeline-client-result"><div><SectionLabel>From a client conversation</SectionLabel><h3>A listing worth sharing.</h3><p>Mary-Ann shares a new listing with the team.</p><p className="pipeline-evidence-note">Client update shown for context. This message alone does not attribute the listing to a particular campaign.</p></div><a href={`${assets}/client-result.png`} target="_blank" rel="noreferrer" aria-label="Open full-size client result image"><Image src={`${assets}/client-result.png`} alt="Client update graphic showing Mary-Ann McLoughlin sharing a property listing with the message New listing." width={1672} height={941} sizes="(max-width: 900px) 94vw, 740px" quality={78} /></a></div>
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
      <div className="pipeline-heading"><SectionLabel>The Free Seller Pipeline Audit</SectionLabel><h2>Where Are Seller{" "}<br />Opportunities{" "}<br /><span className="pipeline-purple">Falling Out?</span></h2><p>In a short 10–15 minute phone call, we’ll review how seller opportunities currently move from enquiry to appraisal and identify the biggest gaps in the process.</p><ul className="pipeline-audit-points">{["See where leads are being lost", "Identify follow-up gaps", "Find opportunities in your existing database"].map(item => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul><MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - offer" className="pipeline-cta">Get My Free Seller Pipeline Audit <ArrowRight size={17} aria-hidden="true" /></MetaTrackedLink></div>
      <div className="pipeline-audit-panel"><div className="pipeline-audit-panel-top"><span><Clock3 size={16} aria-hidden="true" /> 10–15 minute phone audit</span><span>6 areas</span></div><div>{auditAreas.map(({ title, description, Icon }, index) => <article key={title}><span className="pipeline-icon-box"><Icon size={21} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div><span className="pipeline-audit-number">0{index + 1}</span></article>)}</div><p className="pipeline-audit-panel-bottom">A clear view of your pipeline. A practical next step.</p></div>
    </div>
  </section>;
}
