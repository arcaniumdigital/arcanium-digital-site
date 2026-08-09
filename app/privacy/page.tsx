import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f4f8] px-6 py-16 text-[#111114]">
      <article className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#8f33ff]">Arcanium Digital</Link>
        <h1 className="mt-6 font-display text-5xl font-black">Privacy Policy</h1>
        <p className="mt-6 leading-7 text-black/65">When you request a Vendor Conversion Audit, we use the details you provide to respond, arrange the audit, operate reminders you have consented to receive, maintain our customer records, prevent abuse, and measure the funnel’s reliability.</p>
        <p className="mt-4 leading-7 text-black/65">We use service providers including Cloudflare, Vercel, Cal.com, Brevo, ClickSend, Inngest, and our analytics and error-monitoring providers. We limit browser-visible data, protect provider access with server-side credentials, and do not place your contact details in booking links.</p>
        <p className="mt-4 leading-7 text-black/65">You may opt out of marketing SMS at any time by replying STOP. To ask about, correct, or delete your information, contact Arcanium Digital using the contact details published on this website.</p>
        <p className="mt-8 text-sm text-black/45">Version: privacy-v1 · Effective 9 August 2026</p>
      </article>
    </main>
  );
}
