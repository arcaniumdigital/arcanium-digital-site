import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Arcanium Real Estate SEO OS",
  description: "Information about Arcanium Digital's internal Google Ads keyword research integration.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SeoOsPage() {
  return (
    <main className="min-h-screen bg-[#f6f4f8] px-6 py-16 text-[#111114]">
      <article className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#8f33ff]">
          Arcanium Digital
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.16em] text-[#6f1fd1]">Internal operations application</p>
        <h1 className="mt-3 font-display text-5xl font-black sm:text-6xl">Arcanium Real Estate SEO OS</h1>
        <p className="mt-6 text-lg leading-8 text-black/65">
          Arcanium Real Estate SEO OS is an internal application used by Arcanium Digital to research and deliver
          search strategy for our business and for customers who have authorised us to work with their accounts.
        </p>

        <section className="mt-10 border-t border-black/10 pt-8">
          <h2 className="font-display text-2xl font-black">Google Ads integration</h2>
          <p className="mt-3 leading-7 text-black/65">
            An authorised Google Ads user connects their account through Google OAuth. The application can then read
            accessible account identifiers, reporting information, Keyword Planner ideas, and historical keyword
            metrics. We use this data for keyword research, opportunity analysis, SEO planning, and reporting.
          </p>
          <p className="mt-3 leading-7 text-black/65">
            The integration is intentionally read-only. It cannot create or change advertisements, campaigns,
            budgets, billing, payments, or account users.
          </p>
        </section>

        <section className="mt-9">
          <h2 className="font-display text-2xl font-black">Access and control</h2>
          <p className="mt-3 leading-7 text-black/65">
            Access is limited to authorised Arcanium Digital operators. Google access can be revoked at any time from
            the connected user&apos;s Google Account. Credentials are protected locally and are not published in source
            code or exposed in the application interface.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-black/10 pt-8 text-sm font-bold">
          <Link className="text-[#6f1fd1] underline underline-offset-4" href="/privacy">
            Read our Privacy Policy
          </Link>
          <a className="text-[#6f1fd1] underline underline-offset-4" href="mailto:enquiries@arcaniumdigital.com">
            Contact support
          </a>
        </div>
      </article>
    </main>
  );
}
