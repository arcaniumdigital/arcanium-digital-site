"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Check, Copy, MessageSquare, RotateCcw } from "lucide-react";
import { buildPracticeEnquiry, demoScenarios, demoSuburbs, type DemoScenario } from "@/lib/seller-demo";
import styles from "@/app/seller-demo/seller-demo.module.css";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function SellerDemo() {
  const interactive = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [name, setName] = useState("Sam");
  const [suburb, setSuburb] = useState<string>(demoSuburbs[0]);
  const [scenario, setScenario] = useState<DemoScenario>("curious");
  const [enquiry, setEnquiry] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const chatHeading = useRef<HTMLHeadingElement>(null);
  const enquiryText = useRef<HTMLTextAreaElement>(null);

  async function copyEnquiry(text = enquiry) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied. Paste your enquiry into the chat and press send.");
    } catch {
      setCopyStatus("Copy the practice enquiry below, then paste it into the chat.");
      enquiryText.current?.focus();
      enquiryText.current?.select();
    }
  }

  function startDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const draft = buildPracticeEnquiry(name, suburb, scenario);
      setError("");
      setEnquiry(draft);
      setCopyStatus("");
      // Native GHL owns message sending. No undocumented widget send API,
      // production form endpoint, CRM tag, SMS or email request is used.
      void copyEnquiry(draft);
      requestAnimationFrame(() => chatHeading.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check your practice details and try again.");
    }
  }

  return (
    <div className={styles.experience} data-clarity-mask="true">
      <section className={styles.leadPanel} aria-labelledby="practice-heading">
        <div className={styles.sectionTitle}><span className={styles.step}>1</span><h2 id="practice-heading">Your practice enquiry</h2></div>
        <p className={styles.panelCopy}>No real contact details needed. This form prepares your chat message; it does not submit a live lead.</p>
        <form onSubmit={startDemo} aria-busy={!interactive}>
          <fieldset className={styles.formControls} disabled={!interactive}>
          <div className={styles.fieldRow}>
            <label>Practice first name<input value={name} onChange={event => setName(event.target.value)} maxLength={30} required autoComplete="off" aria-describedby="name-help" /></label>
            <label>Example suburb<select value={suburb} onChange={event => setSuburb(event.target.value)}>{demoSuburbs.map(value => <option key={value}>{value}</option>)}</select></label>
          </div>
          <p id="name-help" className={styles.fieldHint}>Use a fictional first name, not a phone number or email.</p>
          <fieldset className={styles.scenarios}>
            <legend>What would you like to try?</legend>
            {demoScenarios.map(item => (
              <label key={item.id} className={`${styles.scenario} ${scenario === item.id ? styles.selected : ""}`}>
                <input type="radio" name="scenario" value={item.id} checked={scenario === item.id} onChange={() => setScenario(item.id)} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </label>
            ))}
          </fieldset>
          {error ? <p role="alert" className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.primary} disabled={!interactive}>{!interactive ? "Preparing demo…" : enquiry ? "Update practice enquiry" : "Start the demo"}<ArrowRight size={18} aria-hidden="true" /></button>
          </fieldset>
          <noscript><p className={styles.panelCopy}>Enable JavaScript to try the demo. This form does not submit a live lead.</p></noscript>
        </form>
      </section>
      <section className={styles.chatPanel} aria-labelledby="chat-heading">
        <div className={styles.sectionTitle}><span className={styles.step}>2</span><h2 id="chat-heading" tabIndex={-1} ref={chatHeading}>The seller conversation</h2></div>
        {enquiry ? (
          <>
            <div className={styles.chatInstructions}>
              <p>Paste this enquiry into the chat to begin. Then reply naturally, ask questions or try an objection.</p>
              <label className={styles.draftLabel}>Practice enquiry<textarea ref={enquiryText} value={enquiry} readOnly rows={4} className={styles.draft} /></label>
              <div className={styles.copyRow}>
                <button type="button" className={styles.secondary} onClick={() => void copyEnquiry()}><Copy size={16} aria-hidden="true" />Copy enquiry</button>
                <span role="status" className={styles.copyStatus}>{copyStatus}</span>
              </div>
            </div>
            <iframe src="/seller-demo/chat.html" title="Arcanium practice seller chat" className={styles.chatFrame} referrerPolicy="no-referrer" />
            <div className={styles.chatFoot}><Check size={16} aria-hidden="true" /><p>Real GHL conversation. For another scenario, update and paste a new practice enquiry. Chat history is retained.</p></div>
          </>
        ) : (
          <div className={styles.emptyChat}>
            <MessageSquare size={36} strokeWidth={1.4} aria-hidden="true" />
            <h3>A real conversation.<br />Without a real lead.</h3>
            <p>Choose a scenario and start the demo. The website chat will open here—no phone or inbox to check.</p>
            <div className={styles.example}><span>Try saying</span><q>I’m just curious. I don’t want to sell yet.</q><p>See how the assistant responds, rather than reading a pre-written conversation.</p></div>
          </div>
        )}
        {enquiry ? <button type="button" className={styles.edit} onClick={() => {setEnquiry(""); setCopyStatus("");}}><RotateCcw size={15} aria-hidden="true" />Return to practice form</button> : null}
      </section>
    </div>
  );
}
