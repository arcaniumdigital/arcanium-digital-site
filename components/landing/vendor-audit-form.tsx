"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

const consentText = "I agree to receive SMS about my Vendor Conversion Audit and related Arcanium Digital services. I can opt out at any time.";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function VendorAuditForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const widgetHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const submissionId = useRef(crypto.randomUUID());
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const endpoint = process.env.NEXT_PUBLIC_VENDOR_AUDIT_API_URL || "/api/vendor-audit";

  useEffect(() => { router.prefetch("/vendor-audit"); }, [router]);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !widgetHost.current || widgetId.current || !siteKey) return;
    widgetId.current = window.turnstile.render(widgetHost.current, {
      sitekey: siteKey,
      action: "vendor_audit",
      theme: "light",
      size: "flexible",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [siteKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setError("");
    if (!turnstileToken || !endpoint) {
      setError("We could not submit your details. Please check your connection and try again.");
      return;
    }
    setLocked(true);
    const params = new URLSearchParams(window.location.search);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          schemaVersion: "2.0",
          submissionId: submissionId.current,
          fullName,
          phone,
          sourcePage: window.location.href,
          referrer: document.referrer || undefined,
          utmSource: params.get("utm_source") || undefined,
          utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined,
          utmTerm: params.get("utm_term") || undefined,
          utmContent: params.get("utm_content") || undefined,
          fbclid: params.get("fbclid") || undefined,
          gclid: params.get("gclid") || undefined,
          marketingSmsConsent: consent,
          consentVersion: "vendor-audit-sms-v1",
          consentText,
          privacyNoticeVersion: "privacy-v1",
          turnstileToken,
          companyWebsiteConfirmation: (new FormData(event.currentTarget).get("companyWebsiteConfirmation") as string) || "",
        }),
      });
      if (!response.ok) throw new Error("SUBMISSION_FAILED");
      const result = await response.json() as { accepted?: boolean; nextUrl?: string };
      if (!result.accepted || result.nextUrl !== "/vendor-audit") throw new Error("INVALID_ACCEPTANCE");
      window.fbq?.("track", "Lead", { content_name: "Vendor Conversion Audit" });
      window.gtag?.("event", "generate_lead", { form_name: "vendor_conversion_audit" });
      router.replace(result.nextUrl);
    } catch {
      setError("We could not submit your details. Please check your connection and try again.");
      setTurnstileToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setLocked(false);
    }
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderTurnstile} />
      <form onSubmit={submit} className="mx-auto grid max-w-[560px] gap-4 p-6 text-left sm:p-8">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-black/70">Full name</span>
          <input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-13 rounded-lg border border-black/15 bg-white px-4 text-base outline-none focus:border-[#8f33ff]" placeholder="Your name" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-black/70">Best mobile number</span>
          <input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-13 rounded-lg border border-black/15 bg-white px-4 text-base outline-none focus:border-[#8f33ff]" placeholder="04xx xxx xxx" />
        </label>
        <label className="sr-only" aria-hidden="true">
          Company website confirmation
          <input name="companyWebsiteConfirmation" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="flex items-start gap-3 text-sm leading-5 text-black/65">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 accent-[#8f33ff]" />
          <span>{consentText} <a href="/privacy" className="font-semibold text-[#6f1fd1] underline">Privacy Policy.</a></span>
        </label>
        <div ref={widgetHost} className="min-h-[65px]" />
        <button type="submit" disabled={locked} className="h-13 rounded-full bg-[#8f33ff] px-6 text-sm font-black uppercase tracking-[0.08em] text-white transition-opacity hover:bg-[#7e25ec] disabled:cursor-default disabled:opacity-70">
          See available audit times
        </button>
        <p aria-live="polite" className="min-h-5 text-center text-sm font-medium text-red-700">{error}</p>
      </form>
    </>
  );
}
