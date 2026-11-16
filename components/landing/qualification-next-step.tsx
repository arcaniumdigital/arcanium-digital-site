"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isCompleteQualification } from "@/lib/qualification-form";
import { useQualificationFlow } from "./qualification-flow-context";
import { AuditVideo } from "./audit-video";
export function QualificationNextStep() {
  const { flow, setFlow } = useQualificationFlow();
  const router = useRouter();
  const allowed = flow.complete && isCompleteQualification(flow.answers);
  useEffect(() => { if (!allowed) router.replace("/"); }, [allowed, router]);
  if (!allowed) return <main className="mv-booking mv-shell"><p role="status">Please complete the qualification form first.</p></main>;
  function back() { setFlow(current => ({ ...current, step: 3 })); router.push("/", { scroll: false }); }
  return <main className="mv-booking mv-shell">
    <p className="mv-last-step">Last Step</p>
    <h1>Book Your 10 Minute Intro Call</h1>
    <p>We&apos;ll review your market, current appraisal volume and whether our system is a fit.</p>
    <div className="mv-booking-video"><AuditVideo /></div>
    <section id="booking" aria-label="Booking calendar" className="mv-booking-placeholder"><p>Online booking will be available here soon.</p></section>
    <button type="button" className="mv-back" onClick={back}>Back</button>
  </main>;
}
