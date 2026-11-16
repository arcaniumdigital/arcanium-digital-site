"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, MessageSquareText, PhoneCall, ShieldCheck } from "lucide-react";
import styles from "./test-ai-forms.module.css";

type Channel = "sms" | "call";
type Status = { kind: "success" | "error"; message: string } | null;

function resultMessage(value: unknown, fallback: string) {
  return value && typeof value === "object" && "message" in value && typeof value.message === "string" ? value.message : fallback;
}

export function TestAiForms() {
  const [channel, setChannel] = useState<Channel>("sms");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  function changeChannel(next: Channel) {
    setChannel(next); setStatus(null); setConsent(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setStatus(null);
    try {
      const response = await fetch(channel === "sms" ? "/api/seller-demo" : "/api/testai/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channel === "sms"
          ? { name, phone, suburb, address, scenario: "selling", smsConsent: consent }
          : { name, phone, suburb, address, callConsent: consent }),
        signal: AbortSignal.timeout(40_000),
      });
      const value: unknown = await response.json().catch(() => null);
      setStatus({
        kind: response.ok ? "success" : "error",
        message: resultMessage(value, response.ok ? "Your demo has started." : "The demo could not start. Please check your details and try again."),
      });
    } catch {
      setStatus({ kind: "error", message: "We could not confirm whether the demo started. Check your phone before trying again." });
    } finally { setSubmitting(false); }
  }

  const isSms = channel === "sms";
  return (
    <div className={styles.experience}>
      <div className={styles.switcher} role="tablist" aria-label="Choose a demo channel">
        <button type="button" role="tab" aria-selected={isSms} className={isSms ? styles.active : ""} onClick={() => changeChannel("sms")}>
          <span className={styles.channelIcon}><MessageSquareText size={21} aria-hidden="true" /></span>
          <span><strong>Test the SMS agent</strong><small>Continue the conversation by text</small></span>
          {isSms ? <Check size={17} aria-hidden="true" /> : null}
        </button>
        <button type="button" role="tab" aria-selected={!isSms} className={!isSms ? styles.active : ""} onClick={() => changeChannel("call")}>
          <span className={styles.channelIcon}><PhoneCall size={21} aria-hidden="true" /></span>
          <span><strong>Test the AI caller</strong><small>Receive an immediate practice call</small></span>
          {!isSms ? <Check size={17} aria-hidden="true" /> : null}
        </button>
      </div>

      <div className={styles.formWrap} role="tabpanel">
        <div className={styles.formHeader}>
          <span>{isSms ? <MessageSquareText size={20} /> : <PhoneCall size={20} />}</span>
          <div><p>{isSms ? "SMS AGENT" : "VOICE AGENT"}</p><h3>{isSms ? "Start a real text conversation." : "Get a call from the AI agent."}</h3></div>
        </div>
        <p className={styles.formCopy}>{isSms ? "The first message will arrive on your mobile. Reply naturally and test questions, hesitation or objections." : "The agent will call the number you enter. Pick up and speak naturally as if you had requested a property appraisal."}</p>

        <form onSubmit={submit} aria-busy={submitting}>
          <fieldset disabled={submitting}>
            <div className={styles.grid}>
              <label>First name<input value={name} onChange={event => setName(event.target.value)} autoComplete="given-name" maxLength={80} required placeholder="Jordan" /></label>
              <label>Australian mobile<input value={phone} onChange={event => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={25} required placeholder="04xx xxx xxx" /></label>
              <label>Suburb<input value={suburb} onChange={event => setSuburb(event.target.value)} autoComplete="address-level2" maxLength={80} required placeholder="Your suburb" /></label>
              <label>Practice property address<input value={address} onChange={event => setAddress(event.target.value)} maxLength={200} required autoComplete="off" placeholder="12 Example Street" /></label>
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required />
              <span>I own this mobile and request {isSms ? "an SMS conversation" : "an immediate AI phone call"} from Arcanium Digital for demonstration purposes. {isSms ? "I can reply STOP at any time." : "I can ask the caller to stop at any time."}</span>
            </label>
            <button className={styles.submit} type="submit">
              {submitting ? "Starting your demo…" : isSms ? "Text me the demo" : "Call me now"}<ArrowRight size={18} aria-hidden="true" />
            </button>
          </fieldset>
          {status ? <div role="status" className={`${styles.status} ${status.kind === "success" ? styles.success : styles.error}`}><ShieldCheck size={18} aria-hidden="true" /><p>{status.message}</p></div> : null}
        </form>
      </div>
    </div>
  );
}
