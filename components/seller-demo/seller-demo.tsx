"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Check, Copy, MessageSquare, RotateCcw } from "lucide-react";
import { buildPracticeEnquiry, demoScenarios, demoSuburbs, type DemoScenario } from "@/lib/seller-demo";
import { validateDemoSmsLead } from "@/lib/seller-demo-sms";
import styles from "@/app/seller-demo/seller-demo.module.css";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function SellerDemo() {
  const interactive = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [name, setName] = useState("Sam");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState("");
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

  function startChat() {
    try {
      // Contact details stay out of the optional website-chat enquiry.
      const draft = buildPracticeEnquiry(name.trim().split(/\s+/)[0], suburb, scenario);
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

  async function startSms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSmsStatus("");
    let lead;
    try { lead = validateDemoSmsLead({ name, phone, suburb, address, scenario, smsConsent }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Check your demo details."); return; }
    setSending(true);
    try {
      const response = await fetch("/api/seller-demo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead), signal: AbortSignal.timeout(10_000),
      });
      const result: unknown = await response.json();
      // No success state exists until a real, isolated provider path is proven.
      const message = result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "SMS could not be started. No SMS was sent.";
      setSmsStatus(message);
    } catch {
      setSmsStatus("The SMS demo could not be reached. No SMS was sent by this demo. Try again later.");
    } finally { setSending(false); }
  }

  return (
    <div className={styles.experience} data-clarity-mask="true">
      <section className={styles.leadPanel} aria-labelledby="practice-heading">
        <div className={styles.sectionTitle}><span className={styles.step}>1</span><h2 id="practice-heading">Your demo enquiry</h2></div>
        <p className={styles.panelCopy}>SMS testing is owner-only. Use your approved test mobile and fictional property details. No clients will be enrolled.</p>
        <form onSubmit={startSms} aria-busy={!interactive || sending}>
          <fieldset className={styles.formControls} disabled={!interactive || sending}>
          <div className={styles.fieldRow}>
            <label>Name<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required autoComplete="name" /></label>
            <label>Mobile number<input type="tel" inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={25} required autoComplete="tel" placeholder="04xx xxx xxx" aria-describedby="phone-help" /></label>
            <label>Suburb<select value={suburb} onChange={event => setSuburb(event.target.value)}>{demoSuburbs.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Property address<input value={address} onChange={event => setAddress(event.target.value)} maxLength={200} required autoComplete="off" placeholder="Use a fictional street address" /></label>
          </div>
          <p id="phone-help" className={styles.fieldHint}>Only the owner’s approved test number is eligible. Other numbers are rejected on the server.</p>
          <fieldset className={styles.scenarios}>
            <legend>What would you like to try?</legend>
            {demoScenarios.map(item => (
              <label key={item.id} className={`${styles.scenario} ${scenario === item.id ? styles.selected : ""}`}>
                <input type="radio" name="scenario" value={item.id} checked={scenario === item.id} onChange={() => setScenario(item.id)} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </label>
            ))}
          </fieldset>
          <label className={styles.consent}><input type="checkbox" checked={smsConsent} onChange={event => setSmsConsent(event.target.checked)} required /><span>I want a test SMS conversation on my own approved mobile. This is not consent to unrelated marketing.</span></label>
          {error ? <p role="alert" className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.primary} disabled={!interactive || sending}>{!interactive ? "Preparing demo…" : sending ? "Checking SMS demo…" : "Start SMS demo"}<ArrowRight size={18} aria-hidden="true" /></button>
          </fieldset>
          {smsStatus ? <p role="status" className={styles.smsStatus}>{smsStatus}</p> : null}
          <noscript><p className={styles.panelCopy}>Enable JavaScript to try the demo. No SMS has been sent.</p></noscript>
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
            <p>The SMS sender is not connected yet. You can still test the conversation here, without sending phone or address details into the chat.</p>
            <button type="button" className={styles.secondary} disabled={!interactive} onClick={startChat}>Try website conversation<ArrowRight size={16} aria-hidden="true" /></button>
            <div className={styles.example}><span>Try saying</span><q>I’m just curious. I don’t want to sell yet.</q><p>See how the assistant responds, rather than reading a pre-written conversation.</p></div>
          </div>
        )}
        {enquiry ? <button type="button" className={styles.edit} onClick={() => {setEnquiry(""); setCopyStatus("");}}><RotateCcw size={15} aria-hidden="true" />Update website scenario</button> : null}
      </section>
    </div>
  );
}
