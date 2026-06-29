"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, PhoneCall } from "lucide-react";

type LeadFormState = {
  fullName: string;
  phone: string;
};

export function QuickCallSection() {
  const [form, setForm] = useState<LeadFormState>({ fullName: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof LeadFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
    fbq?.("track", "Lead", {
      content_name: "Five minute fit check",
      lead_source: "VSL quick call form",
    });

    setSubmitted(true);
  };

  return (
    <section id="quick-call" className="relative border-y border-foreground/10 bg-foreground/[0.025] py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:px-12">
        <div>
          <span className="mb-5 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-10 bg-foreground/30" />
            Not ready to book yet?
          </span>
          <h2 className="max-w-3xl font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
            Want a quick call before the full strategy session?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Leave your name and mobile. Jordan will personally give you a 5-minute call to see if an agent site makes sense before you commit to a longer meeting.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span>No pressure</span>
            <span>No long pitch</span>
            <span>Just a quick fit check</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-foreground/10 bg-background p-5 shadow-2xl shadow-foreground/5"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#eca8d6] text-black">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-2xl">Call me first</h3>
              <p className="text-sm text-muted-foreground">A lower-commitment first step.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground/80">Full name</span>
              <input
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="h-12 border border-foreground/10 bg-foreground/[0.03] px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-[#eca8d6]"
                placeholder="Your name"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground/80">Phone number</span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="h-12 border border-foreground/10 bg-foreground/[0.03] px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-[#eca8d6]"
                placeholder="Your mobile"
              />
            </label>
          </div>

          <button
            type="submit"
            className="group mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#eca8d6] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#f1b7e0]"
          >
            Call me for 5 minutes
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="mt-4 min-h-5 text-sm text-muted-foreground">
            {submitted
              ? "Thanks. This step is ready for lead routing once your preferred inbox or CRM is connected."
              : "Prefer the full breakdown? You can still book the 60-minute call below."}
          </p>
        </form>
      </div>
    </section>
  );
}
