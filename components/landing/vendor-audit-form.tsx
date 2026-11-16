"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { QualificationSecurity, crmEnabled, submitQualification } from "./qualification-submit";
import { useRouter } from "next/navigation";
import { appraisalOptions, isCompleteQualification, isQualifyingRole, qualificationError, roleOptions, type QualificationAnswers } from "@/lib/qualification-form";
import { useQualificationFlow } from "./qualification-flow-context";

const questions = ["Where would you like more seller appraisals?", "What best describes you?", "How many appraisals do you currently conduct per month?", "Your contact details"];
const disqualificationMessage = "Thanks for your interest. Our service is currently designed exclusively for residential real estate sales professionals.";
export function VendorAuditForm() {
  const { flow, setFlow } = useQualificationFlow();
  const { step, answers } = flow;
  const [turnstileToken,setTurnstileToken]=useState("");
  const [securityAttempt,setSecurityAttempt]=useState(0);
  const [saving,setSaving]=useState(false);
  const submissionId=useRef(crypto.randomUUID());
  const locked=useRef(false);
  const [inputError,setInputError]=useState(false);
  const [error, setError] = useState("");
  const [navigating, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const hasAdvanced = useRef(step > 0);
  const router = useRouter();
  const disqualified = Boolean(answers.role && !isQualifyingRole(answers.role));

  useEffect(() => {
    if (!hasAdvanced.current) return;
    const target = disqualified ? form.current?.querySelector<HTMLElement>("[role=status]") : form.current?.querySelector<HTMLInputElement>("input:checked, input:not([type=radio])") ?? form.current?.querySelector<HTMLInputElement>("input");
    target?.focus({ preventScroll: true });
    form.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step, disqualified]);

  function update(key: keyof QualificationAnswers, value: string) {
    setFlow(current => ({ ...current, complete: false, answers: { ...current.answers, [key]: value } }));
    setError("");setInputError(false);
    if (key === "role") hasAdvanced.current = true;
  }
  function choose(key: "role" | "appraisals", value: string) {
    hasAdvanced.current = true;
    setError("");setInputError(false);
    setFlow(current => {
      const nextAnswers = { ...current.answers, [key]: value };
      const nextStep = key === "role" ? (isQualifyingRole(value) ? 2 : 1) : 3;
      return { ...current, step: nextStep, complete: false, answers: nextAnswers };
    });
  }
  function back() {
    hasAdvanced.current = true;
    setError("");setInputError(false);
    setFlow(current => disqualified ? { ...current, step: 1, complete: false, answers: { ...current.answers, role: "" } } : { ...current, step: Math.max(0, step - 1), complete: false });
  }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disqualified || navigating || locked.current) return;
    const validationError = step === 3
      ? qualificationError(3, answers) || qualificationError(4, answers) || qualificationError(5, answers)
      : qualificationError(step, answers);
    if (validationError) {
      setError(validationError);setInputError(true);
      (form.current?.querySelector("input:checked, input") as HTMLInputElement | null)?.focus();
      return;
    }
    hasAdvanced.current = true;
    setError("");setInputError(false);
    if (step < 3) { setFlow(current => ({ ...current, step: step + 1, complete: false })); return; }
    if (!isCompleteQualification(answers)) return;
    if (crmEnabled) {
      if (!turnstileToken) {setError("Please wait for the security check, then try again.");return;}
      locked.current=true;setSaving(true);
      try { await submitQualification(answers,submissionId.current,turnstileToken); }
      catch(error){setError(error instanceof Error?error.message:"Unable to save. Please try again.");setSaving(false);locked.current=false;setSecurityAttempt(value=>value+1);return;}
      setSaving(false);locked.current=false;
    }

    setFlow(current => ({ ...current, complete: true }));
    startTransition(() => router.push("/vendor-lead-opportunity"));
  }

  return <form ref={form} onSubmit={next} noValidate autoComplete="on" className="mv-form mv-question-form sentry-block" data-clarity-mask="true">
    <div className="mv-form-progress"><span>Question {step + 1} of 4</span><progress max={4} value={step + 1} aria-label="Qualification progress" /></div>
    {disqualified ? <div className="mv-question-screen mv-disqualified" key="disqualified"><p role="status" tabIndex={-1}>{disqualificationMessage}</p></div> : <div className="mv-question-screen" key={step}>
      <h2 id="mv-qualification-question">{questions[step]}</h2>
      {step === 0 && <label className="mv-field"><span>Suburbs or region</span><input required minLength={2} maxLength={200} autoComplete="off" placeholder="e.g. Sunshine Coast" value={answers.region} onChange={event => update("region", event.target.value)} aria-invalid={inputError && Boolean(error)} aria-describedby={error ? "mv-qualification-error" : undefined} /></label>}
      {(step === 1 || step === 2) && <fieldset className="mv-choices" aria-labelledby="mv-qualification-question" aria-describedby={error ? "mv-qualification-error" : undefined}><legend className="sr-only">{step === 1 ? "Your role" : "Monthly appraisals"}</legend>{(step === 1 ? roleOptions : appraisalOptions).map(option => <label key={option} className="mv-choice"><input type="radio" required name={step === 1 ? "role" : "appraisals"} value={option} checked={(step === 1 ? answers.role : answers.appraisals) === option} onChange={() => choose(step === 1 ? "role" : "appraisals", option)} /><span>{option}</span></label>)}</fieldset>}
      {step === 3 && <>
        <p id="mv-qualification-help" className="mv-question-help">So we can send you important information</p>
        <div className="mv-contact-fields">
          <label className="mv-field" htmlFor="mv-full-name"><span>Full name</span><input id="mv-full-name" name="name" required autoComplete="name" maxLength={120} value={answers.fullName} onChange={event => update("fullName", event.target.value)} aria-invalid={inputError && Boolean(qualificationError(3, answers))} /></label>
          <label className="mv-field" htmlFor="mv-email"><span>Email</span><input id="mv-email" name="email" required type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={answers.email} onChange={event => update("email", event.target.value)} aria-invalid={inputError && Boolean(qualificationError(4, answers))} /></label>
          <label className="mv-field" htmlFor="mv-phone"><span>Phone number</span><input id="mv-phone" name="tel" required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={answers.phone} placeholder="0412 345 678" onChange={event => update("phone", event.target.value)} aria-invalid={inputError && Boolean(qualificationError(5, answers))} /></label>
        </div>
        {crmEnabled ? <QualificationSecurity key={securityAttempt} onToken={setTurnstileToken}/> : <p className="mv-form-notice">No application is sent at this stage.</p>}
      </>}
      {error && <p id="mv-qualification-error" role="alert" className="mv-form-error">{error}</p>}
    </div>}
    <div className="mv-form-actions">
      {step > 0 && <button type="button" className="mv-back" onClick={back} disabled={navigating || saving}>Back</button>}
      {!disqualified && (step === 0 || step === 3) && <button type="submit" disabled={navigating || saving} className="mv-button">{saving ? "Saving…" : navigating ? "Opening…" : step === 3 ? "Submit" : "Continue"}</button>}
    </div>
  </form>;
}
