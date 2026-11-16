"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { BOOKING_CONSENT_TEXT, MARKETING_CONSENT_TEXT, MOREVENDORS_CONSENT_VERSION, MOREVENDORS_PRIVACY_VERSION } from "@/lib/morevendors-consent";
import type { QualificationAnswers } from "@/lib/qualification-form";
import { trackMetaEvent } from "@/lib/meta-pixel";

type TurnstileApi = { render(element: HTMLElement, options: Record<string, unknown>): string; reset(id?: string): void; remove(id: string): void };
declare global { interface Window { turnstile?: TurnstileApi } }
export const crmEnabled = process.env.NEXT_PUBLIC_MOREVENDORS_CRM_ENABLED === "true";
export function QualificationSecurity({ onToken }: { onToken:(value:string)=>void }) {
  const host = useRef<HTMLDivElement>(null), widget = useRef<string | null>(null);
  const [securityError,setSecurityError]=useState(false);
  const render = useCallback(()=>{
    if (!host.current || !window.turnstile || widget.current) return;
    widget.current=window.turnstile.render(host.current,{sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY??"0x4AAAAAAEKyjTaSL4ULZqy6",action:"vendor_audit",theme:"light",appearance:"interaction-only",callback:(token:string)=>{onToken(token);setSecurityError(false);},"expired-callback":()=>onToken(""),"error-callback":()=>{onToken("");setSecurityError(true);}});
  },[onToken]);
  useEffect(()=>{render();return()=>{if(widget.current){window.turnstile?.remove(widget.current);widget.current=null;}onToken("");};},[render,onToken]);
  return <div className="mv-submission-security">
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render}/><div ref={host}/>
    {securityError&&<p role="status">Security check unavailable. Please reload and try again.</p>}
  </div>;
}
export async function submitQualification(answers:QualificationAnswers, submissionId:string, token:string) {
  const query=new URLSearchParams(window.location.search);
  const attribution=Object.fromEntries([['utmSource','utm_source'],['utmMedium','utm_medium'],['utmCampaign','utm_campaign'],['utmTerm','utm_term'],['utmContent','utm_content']].map(([field,key])=>[field,query.get(key)?.slice(0,200)||undefined]));
  const response=await fetch('/api/vendor-audit',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({schemaVersion:'2.0',submissionId,fullName:answers.fullName,phone:answers.phone,email:answers.email,primarySuburb:answers.region,agentRole:answers.role,monthlyAppraisals:answers.appraisals,funnelDestination:'vendor-lead-opportunity',sourcePage:window.location.origin+'/',referrer:document.referrer.slice(0,500)||undefined,...attribution,prospectTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,bookingCommunicationsConsent:true,marketingSmsConsent:false,consentVersion:MOREVENDORS_CONSENT_VERSION,consentText:BOOKING_CONSENT_TEXT+'\n'+MARKETING_CONSENT_TEXT,privacyNoticeVersion:MOREVENDORS_PRIVACY_VERSION,turnstileToken:token}),signal:AbortSignal.timeout(45000)});
  const result=await response.json() as {accepted?:boolean;saved?:boolean;nextUrl?:string;leadPublicId?:string;error?:string};
  if(!response.ok||!result.accepted||!result.saved||result.nextUrl!='/vendor-lead-opportunity') throw new Error(result.error==='SUBMISSION_IN_PROGRESS'?'Your application is still processing. Please wait a moment and retry.':'We couldn’t finish saving your application. Please try again. Your answers are still here.');
  // One accepted application event per submission. Never treat it as a booked appointment.
  try{const key=`morevendors:lead:${submissionId}`;if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');trackMetaEvent('Lead',{content_name:'More Vendors qualified application',event_id:result.leadPublicId??submissionId});}}catch{/* Storage restrictions must not prevent a successful redirect. */}
  return result;
}
