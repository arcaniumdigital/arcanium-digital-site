"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, MapPin, MessageSquareText, PhoneCall, ShieldCheck, Smartphone, UserRound } from "lucide-react";
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
      <div className={styles.channelPanel}>
        <div className={styles.channelIntro}>
          <h3>Choose how you want to test it.</h3>
          <p>Your details stay the same when you switch between text and voice.</p>
        </div>
        <div className={styles.switcher} role="tablist" aria-label="Choose a demo channel">
          <button type="button" role="tab" aria-selected={isSms} className={isSms ? styles.active : ""} onClick={() => changeChannel("sms")}>
            <span className={styles.channelIcon}><MessageSquareText size={21} aria-hidden="true" /></span>
            <span><strong>SMS conversation</strong><small>Reply naturally by text</small></span>
            <span className={styles.selectionMark}>{isSms ? <Check size={16} aria-hidden="true" /> : null}</span>
          </button>
          <button type="button" role="tab" aria-selected={!isSms} className={!isSms ? styles.active : ""} onClick={() => changeChannel("call")}>
            <span className={styles.channelIcon}><PhoneCall size={21} aria-hidden="true" /></span>
            <span><strong>AI phone call</strong><small>Talk with the agent now</small></span>
            <span className={styles.selectionMark}>{!isSms ? <Check size={16} aria-hidden="true" /> : null}</span>
          </button>
        </div>
        <div className={styles.channelNote}>
          <ShieldCheck size={18} aria-hidden="true" />
          <p>Only the number you enter is contacted. No client or real-estate agent is notified.</p>
        </div>
      </div>

      <div className={styles.formWrap} role="tabpanel">
        <div className={styles.formHeader}>
          <span>{isSms ? <MessageSquareText size={20} /> : <PhoneCall size={20} />}</span>
          <div><h3>{isSms ? "Start a real text conversation." : "Get a call from the AI agent."}</h3><p>{isSms ? "The first message will arrive on your mobile." : "Your mobile should ring shortly after you submit."}</p></div>
        </div>

        <form onSubmit={submit} aria-busy={submitting}>
          <fieldset disabled={submitting}>
            <div className={styles.grid}>
              <label><span className={styles.labelText}><UserRound size={15} aria-hidden="true" />First name</span><input value={name} onChange={event => setName(event.target.value)} autoComplete="given-name" maxLength={80} required placeholder="Jordan" /></label>
              <label><span className={styles.labelText}><Smartphone size={15} aria-hidden="true" />Australian mobile</span><input value={phone} onChange={event => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={25} required placeholder="04xx xxx xxx" /></label>
              <label className={styles.addressField}><span className={styles.labelText}><MapPin size={15} aria-hidden="true" />Practice property address</span><input value={address} onChange={event => setAddress(event.target.value)} maxLength={200} required autoComplete="street-address" placeholder="12 Example Street" /></label>
              <label><span className={styles.labelText}>Suburb</span><input value={suburb} onChange={event => setSuburb(event.target.value)} autoComplete="address-level2" maxLength={80} required placeholder="Pelican Waters" /></label>
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required />
              <span>{isSms ? "Send the live SMS demo to this number." : "Call this number for the live AI demo."}</span>
            </label>
            <button className={styles.submit} type="submit">
              <span>{submitting ? "Starting your demo…" : isSms ? "Text me the demo" : "Call me now"}</span><ArrowRight size={18} aria-hidden="true" />
            </button>
          </fieldset>
          {status ? <div role="status" className={`${styles.status} ${status.kind === "success" ? styles.success : styles.error}`}><ShieldCheck size={18} aria-hidden="true" /><p>{status.message}</p></div> : null}
        </form>
      </div>
    </div>
  );
}
