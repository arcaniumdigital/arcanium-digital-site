"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [sent, setSent] = useState(false);

  const sendTestError = () => {
    Sentry.captureException(new Error("Sentry verification test"), {
      tags: { test_event: "true" },
    });
    setSent(true);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f4f8] px-6 text-[#111114]">
      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-[0_28px_80px_rgba(63,32,94,0.14)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8f33ff]">Sentry verification</p>
        <h1 className="mt-3 font-display text-4xl font-black leading-none">Send a test error</h1>
        <p className="mt-4 text-sm font-medium leading-relaxed text-[#111114]/60">
          This sends one labelled test event to Sentry without interrupting the website.
        </p>
        <button
          type="button"
          onClick={sendTestError}
          className="mt-7 h-12 w-full rounded-full bg-[#8f33ff] px-5 text-sm font-black text-white transition-colors hover:bg-[#7b25e8]"
        >
          {sent ? "Test error sent" : "Send test error"}
        </button>
        {sent && <p className="mt-4 text-sm font-bold text-[#111114]/65">Check Sentry Issues in a few moments.</p>}
      </section>
    </main>
  );
}
