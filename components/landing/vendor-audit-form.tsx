"use client";

import * as Sentry from "@sentry/nextjs";
import Script from "next/script";
import { useCallback, useRef, useState, type FormEvent } from "react";

const consentText =
  "By submitting this form, I agree to receive SMS about my Vendor Conversion Audit and related Arcanium Digital services. I can opt out at any time.";

function optionalField(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim().slice(0, maxLength);
  return normalized || undefined;
}

class SubmissionFailure extends Error {
  constructor(
    readonly status: number,
    readonly reason: string,
  ) {
    super(`SUBMISSION_FAILED_${status}_${reason}`);
    this.name = "SubmissionFailure";
  }
}

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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const widgetHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const submissionId = useRef(crypto.randomUUID());
  const turnstileWarningCaptured = useRef(false);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAEKyjTaSL4ULZqy6";
  const configuredEndpoint = process.env.NEXT_PUBLIC_VENDOR_AUDIT_API_URL;

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !widgetHost.current || widgetId.current || !siteKey) return;
    widgetId.current = window.turnstile.render(widgetHost.current, {
      sitekey: siteKey,
      action: "vendor_audit",
      theme: "light",
      appearance: "interaction-only",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [siteKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setError("");

    const endpoint = configuredEndpoint || "/api/vendor-audit";
    if (!turnstileToken) {
      if (!turnstileWarningCaptured.current) {
        turnstileWarningCaptured.current = true;
        Sentry.captureMessage("Vendor audit blocked: Turnstile token unavailable", {
          level: "warning",
          tags: {
            funnel: "vendor-audit",
            stage: "turnstile-validation",
          },
        });
      }
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
          fullName: fullName.trim(),
          phone: phone.trim(),
          // Attribution values are sent separately below. Keeping this to the
          // canonical page prevents long Meta click URLs exceeding the Worker contract.
          sourcePage: `${window.location.origin}${window.location.pathname}`.slice(0, 500),
          referrer: optionalField(document.referrer, 500),
          utmSource: optionalField(params.get("utm_source"), 200),
          utmMedium: optionalField(params.get("utm_medium"), 200),
          utmCampaign: optionalField(params.get("utm_campaign"), 200),
          utmTerm: optionalField(params.get("utm_term"), 200),
          utmContent: optionalField(params.get("utm_content"), 200),
          fbclid: optionalField(params.get("fbclid"), 500),
          gclid: optionalField(params.get("gclid"), 500),
          marketingSmsConsent: true,
          consentVersion: "vendor-audit-sms-v1",
          consentText,
          privacyNoticeVersion: "privacy-v1",
          turnstileToken,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        accepted?: boolean;
        nextUrl?: string;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new SubmissionFailure(response.status, result?.error || "UNKNOWN_RESPONSE");
      }
      if (!result?.accepted || result.nextUrl !== "/vendor-audit") {
        throw new Error("INVALID_ACCEPTANCE");
      }

      window.fbq?.("track", "Lead", { content_name: "Suburb Visibility Audit" });
      window.gtag?.("event", "generate_lead", { form_name: "suburb_visibility_audit" });
      window.location.replace(result.nextUrl);
    } catch (caughtError) {
      Sentry.captureException(
        caughtError instanceof Error
          ? caughtError
          : new Error("UNKNOWN_VENDOR_AUDIT_SUBMISSION_FAILURE"),
        {
          tags: {
            funnel: "vendor-audit",
            stage: "lead-submission",
            endpoint: configuredEndpoint ? "configured" : "first-party",
            ...(caughtError instanceof SubmissionFailure
              ? {
                  response_status: String(caughtError.status),
                  rejection_reason: caughtError.reason,
                }
              : {}),
          },
        }
      );
      setError("We could not submit your details. Please check your connection and try again.");
      setTurnstileToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setLocked(false);
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderTurnstile}
      />
      <form onSubmit={submit} className="mx-auto grid max-w-[600px] gap-4 p-5 text-left sm:p-8">
        <label className="grid gap-2.5">
          <span className="text-sm font-bold text-[#111218]/70">Full name</span>
          <input required minLength={2} maxLength={120} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-[58px] rounded-[14px] border border-black/12 bg-white px-[18px] text-base text-[#111218] outline-none transition duration-200 placeholder:text-black/30 hover:border-black/22 focus:border-[#8f33ff] focus:ring-[3px] focus:ring-[#8f33ff]/10" placeholder="Your name" />
        </label>
        <label className="grid gap-2.5">
          <span className="text-sm font-bold text-[#111218]/70">Best mobile number</span>
          <input required minLength={8} maxLength={30} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-[58px] rounded-[14px] border border-black/12 bg-white px-[18px] text-base text-[#111218] outline-none transition duration-200 placeholder:text-black/30 hover:border-black/22 focus:border-[#8f33ff] focus:ring-[3px] focus:ring-[#8f33ff]/10" placeholder="04xx xxx xxx" />
        </label>
        <div ref={widgetHost} />
        <button type="submit" disabled={locked} className="min-h-[58px] rounded-[14px] border border-black/10 bg-[#101114] px-6 text-sm font-semibold uppercase tracking-[0.06em] text-white transition duration-300 hover:-translate-y-px hover:bg-[#18191f] disabled:cursor-default disabled:opacity-70">
          {locked ? "Opening audit times…" : "Check my visibility"}
        </button>
        <p className="text-center text-[13px] leading-5 text-black/50">
          By continuing, you agree to receive SMS about your audit.{" "}
          <a href="/privacy" className="font-semibold text-[#6f1fd1] underline decoration-[#6f1fd1]/35 underline-offset-2">Privacy Policy.</a>
        </p>
        <p aria-live="polite" className="min-h-5 text-center text-sm font-medium text-red-700">{error}</p>
      </form>
    </>
  );
}
