export const faqs = [
  { question: "Is this just Facebook lead generation?", answer: "No. Meta campaigns are the starting point. The service connects lead generation with instant response, AI qualification, appointment setting and ongoing nurture, so each enquiry has a next step." },
  { question: "What happens when a homeowner isn’t ready to sell yet?", answer: "They enter a 33-touch nurture sequence designed to keep the conversation open through market updates, seller education and follow-up. When their timing changes, they can move back into an appraisal conversation." },
  { question: "Do I still need to follow up personally?", answer: "You remain the agent and the trusted human relationship. The system handles the initial response, qualification and routine follow-up. You handle the appraisal, personal advice and listing conversation, with a human hand-off when it is needed." },
  { question: "Does the AI pretend to be me?", answer: "The AI’s role is to assist with qualification and booking, not to replace your professional advice. It should be introduced as an assistant, with a clear hand-off whenever a homeowner needs to speak with you." },
  { question: "How does the free Seller Pipeline Audit work?", answer: "Share your name and mobile number, then choose a time. In a 10–15 minute phone call, we review your lead sources, response speed, follow-up, nurture, booking and tracking. You leave with a clearer view of where seller opportunities may be getting lost." },
];

export function FaqSection() {
  return <section id="faq" className="pipeline-section pipeline-dark"><div className="pipeline-container pipeline-faq-layout"><div className="pipeline-heading"><p className="pipeline-label"><span />A few useful answers</p><h2>Before we{" "}<br /><span className="pipeline-soft">talk pipeline.</span></h2><p>What to expect from the system and your free audit.</p></div><div className="pipeline-faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>;
}
