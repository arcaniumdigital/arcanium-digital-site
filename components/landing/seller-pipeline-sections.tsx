import { discoveryCtaLabel } from "@/lib/funnel-offer";
import Image from "next/image";
import { ArrowDown, ArrowRight, Check, CalendarCheck, MessageCircle, RefreshCw, Target, Zap, Users, Phone, Mail } from "lucide-react";
import { PipelineFormCta } from "@/components/landing/pipeline-form-cta";

import { SellerJourneyMotion } from "@/components/landing/seller-journey-motion";

const assets = "/images/seller-pipeline";

export function LeadComparisonSection() {
  const paths = [
    { name: "Lead delivery only", label: "The usual hand-off", mobileSteps: ["Seller Lead from Meta Ads", "Agent follows up", "No answer", "Other work takes priority", "Opportunity goes cold"], steps: ["Seller Lead from Meta Ads", "Agent follows up when available", "Homeowner doesn’t answer", "Other work takes priority", "Potential listing opportunity goes cold"], end: "The follow-up is left to you.", active: false },
    { name: "More Vendors", label: "The follow-through", mobileSteps: ["Seller Lead from Meta Ads", "AI Assistant Follows Up Immediately", "Intent qualified", "Book or nurture", "A clear next step"], steps: ["Seller Lead from Meta Ads", "AI Assistant Follows Up Immediately", "Seller intent is qualified", "Appointment booked or nurture begins", "Every homeowner has a next step"], end: "Every homeowner has a next step.", active: true },
  ];
  const icons = [Users, Zap, MessageCircle, CalendarCheck, RefreshCw];
  return <section id="the-difference" className="pipeline-section pipeline-dark">
    <div className="pipeline-container">
      <div data-motion="keyword" className="pipeline-heading"><h2>How Many Potential Listings Are <span className="motion-keyword">Slipping</span> <span className="pipeline-soft">Through the Cracks?</span></h2></div>
      <div className="pipeline-comparison" data-comparison-story>
        {paths.map((path) => <article key={path.name} className={`pipeline-path ${path.active ? "pipeline-path-active" : ""}`}>
          <div className="pipeline-path-title"><div><p>{path.label}</p><h3>{path.name}</h3></div>{path.active ? <span className="pipeline-mini-badge">Managed for you</span> : <Mail size={24} aria-hidden="true" />}</div>
          <div className="comparison-journey"><span className="comparison-rail" aria-hidden="true" /><span className="comparison-signal" aria-hidden="true" /><ol>{path.steps.map((step, index) => { const Icon = icons[index]; return <li key={step}><div className="pipeline-flow-row"><span className="pipeline-flow-icon">{path.active ? <Icon size={19} aria-hidden="true" /> : <span>0{index + 1}</span>}</span><span className="pipeline-step-copy"><span className="pipeline-step-desktop">{step}</span><span className="pipeline-step-mobile">{path.mobileSteps[index]}</span></span>{path.active && index === 4 && <Check size={18} className="ml-auto text-[#65d9bb]" aria-hidden="true" />}</div>{index < path.steps.length - 1 && <ArrowDown className="pipeline-flow-arrow" size={16} aria-hidden="true" />}</li>; })}</ol></div>
          <p className="pipeline-path-end">{path.end}</p>
        </article>)}
      </div>
      <p className="mt-8 max-w-[650px] text-base leading-[1.75] text-[#aaaab2]">The next seller who enquires might not be ready today. Will you still be in the conversation when they are?</p>
      <PipelineFormCta
        title="Book your free 10-minute discovery call and receive your complimentary growth guide."
        buttonLabel={discoveryCtaLabel}
        trackingLabel="Seller Pipeline Audit - lead comparison"
      />
    </div>
  </section>;
}

export function SellerSystemSection() {
  const stages = [
    { title: "We generate.", description: "Targeted Meta ads bring in local homeowner enquiries.", Icon: Target },
    { title: "We respond.", description: "Our AI assistant calls homeowner enquiries back within 60 seconds of them submitting their details, with SMS follow-up.", Icon: Phone },
    { title: "We qualify.", description: "AI identifies the homeowner’s selling intent, timeframe and next step.", Icon: MessageCircle },
    { title: "We follow up.", description: "Unanswered leads receive further call and message attempts. Future sellers enter ongoing nurture.", Icon: RefreshCw },
    { title: "We book.", description: "Ready homeowners are booked directly into the agent’s appraisal calendar.", Icon: CalendarCheck },
    { title: "You show up.", description: "You handle the appraisal, build the relationship and work toward winning the listing.", Icon: Users },
  ];
  return <section id="how-it-works" className="pipeline-section pipeline-light">
    <div className="pipeline-container">
      <div data-motion="keyword" className="pipeline-heading"><h2>One enquiry.<br /><span className="motion-keyword pipeline-purple">A clear next step.</span></h2></div>
      <SellerJourneyMotion>
        <ol className="process-steps">
          {stages.map(({ title, description, Icon }, index) => <li className="process-step" key={title}>
            <div className="process-step-top"><span className="process-node" data-journey-node={index}>
              {index === 4 ? <svg className="journey-calendar" viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 10h16" /><rect className="calendar-slot" x="12" y="13" width="4" height="4" rx="1" /><path className="calendar-tick" d="m8 15 3 3 5-6" /></svg> : <Icon size={27} strokeWidth={1.5} aria-hidden="true" />}
              {index === 1 && <span className="journey-voice" aria-hidden="true"><i /><i /><i /></span>}
            </span><span className="process-number">0{index + 1}</span></div>
            <div className="process-connector" aria-hidden="true"><span /></div>
            <h3>{title}</h3><p>{description}</p>
          </li>)}
        </ol>
        <div className="process-nurture"><span className="process-nurture-icon" data-journey-node="6"><RefreshCw size={22} aria-hidden="true" /></span><div><h3>Ready sellers go straight to booking.</h3><p>No answer? We try again. Not ready? Ongoing nurture brings sellers back to booking when their timing changes. Contact stops on opt-out.</p></div><span className="process-nurture-path" aria-hidden="true"><span /></span><span className="process-nurture-label">Back to booking <ArrowRight size={15} aria-hidden="true" /></span></div>
      </SellerJourneyMotion>
      <PipelineFormCta
        title="See how this system could fit your agency."
        buttonLabel={discoveryCtaLabel}
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
        <article className="pipeline-intent-card"><div className="pipeline-intent-heading"><h3>Turn intent into a next step.</h3><p>Identify intent. Offer an appointment. Work toward a booked appraisal.</p></div><figure><Image src={`${assets}/ai-conversation.png`} alt="Illustrative AI conversation: Sarah is considering selling in the next few months, accepts an appraisal offer and is offered appointment times." width={1254} height={1254} sizes="(max-width: 760px) 94vw, 580px" quality={78} /><figcaption>Illustrative conversation. Appointment times offered.</figcaption></figure></article>
        <article className="pipeline-intent-card"><div className="pipeline-intent-heading"><h3>Keep future sellers in reach.</h3><p>Identify future timing. Enter 33-touch nurture. Requalify when plans change.</p></div><figure><Image src={`${assets}/future-seller.png`} alt="Illustrative low-intent conversation followed by a 33-touch nurture plan with market updates, seller education, local sales and check-ins." width={1254} height={1254} sizes="(max-width: 760px) 94vw, 580px" quality={78} /><figcaption>Illustrative conversation and future seller nurture plan.</figcaption></figure></article>
      </div>
    </div>
  </section>;
}

export function SellerProofSection() {
  return <section id="proof" className="pipeline-section pipeline-light">
    <div className="pipeline-container">
      <div className="pipeline-heading"><h2>Here&apos;s what the system achieves within only <span className="pipeline-purple">TWO weeks</span> of starting.</h2></div>
      <div data-motion="proof" className="pipeline-proof-grid">
        <article className="pipeline-proof-card">
          <a className="pipeline-proof-image" href={`${assets}/meta-dashboard-two-weeks.png`} target="_blank" rel="noopener noreferrer" aria-label="Enlarge Meta campaign results screenshot"><Image src={`${assets}/meta-dashboard-two-weeks.png`} alt="Meta Ads Manager, 28 October to 10 November 2026: three ad sets with 3, 3 and 10 form leads, and spend of $66.50, $43.94 and $132.61." width={2792} height={986} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 94vw, 1140px" unoptimized /></a><p className="pipeline-proof-zoom">Tap image to enlarge</p>
          <div className="pipeline-metrics"><div><strong>$243.05</strong><span>Total spend</span></div><div><strong>16</strong><span>Meta enquiries<br />(not booked appraisals)</span></div><div><strong>3</strong><span>Ad sets</span></div></div>
        </article>
      </div>
    </div>
  </section>;
}
