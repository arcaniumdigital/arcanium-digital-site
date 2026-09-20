import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Arcanium Digital handles website, communications, and Google Ads API data.",
};

const sectionClassName = "mt-9";
const headingClassName = "font-display text-2xl font-black";
const paragraphClassName = "mt-3 leading-7 text-black/65";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f4f8] px-6 py-16 text-[#111114]">
      <article className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#8f33ff]">
          Arcanium Digital
        </Link>
        <h1 className="mt-6 font-display text-5xl font-black">Privacy Policy</h1>
        <p className={paragraphClassName}>
          This policy explains how Arcanium Digital handles information collected through our website,
          communications, and internal SEO operations software, including the Arcanium Real Estate SEO OS.
        </p>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Website and enquiry information</h2>
          <p className={paragraphClassName}>
            When you request a Vendor Conversion Audit or contact us, we use the details you provide to respond,
            arrange the audit, operate reminders you have consented to receive, maintain our customer records,
            prevent abuse, and measure the funnel&apos;s reliability.
          </p>
          <p className={paragraphClassName}>
            You may opt out of marketing SMS at any time by replying STOP.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Google Ads API information</h2>
          <p className={paragraphClassName}>
            The Arcanium Real Estate SEO OS connects to Google Ads only after an authorised Google Ads user gives
            consent through Google OAuth. The integration requests the Google Ads scope and can read customer
            account identifiers, account and campaign reporting data, Keyword Planner ideas, and historical keyword
            metrics for accounts that the authorised user can access.
          </p>
          <p className={paragraphClassName}>
            We use this information to perform internal keyword research, search strategy, reporting, and SEO delivery
            for Arcanium Digital and customers who have authorised us to work with their accounts. The current
            integration is read-only: it does not create or change advertisements, campaigns, budgets, billing,
            payments, or account users.
          </p>
          <p className={paragraphClassName}>
            OAuth credentials are protected in the operator&apos;s macOS Keychain. Google Ads results are requested on
            demand and may be included in internal research records or reports needed to deliver the requested work.
            We do not sell Google user data or use it for personalised advertising.
          </p>
          <p className={paragraphClassName}>
            Our use and transfer of information received from Google APIs follows the{" "}
            <a
              className="font-semibold text-[#6f1fd1] underline underline-offset-2"
              href="https://developers.google.com/terms/api-services-user-data-policy"
              rel="noreferrer"
              target="_blank"
            >
              Google API Services User Data Policy
            </a>
            , including its Limited Use requirements. You can revoke the application&apos;s access at any time from your{" "}
            <a
              className="font-semibold text-[#6f1fd1] underline underline-offset-2"
              href="https://myaccount.google.com/connections"
              rel="noreferrer"
              target="_blank"
            >
              Google Account&apos;s third-party connections page
            </a>
            .
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Service providers and disclosure</h2>
          <p className={paragraphClassName}>
            We use service providers including Cloudflare, Vercel, Cal.com, Brevo, ClickSend, Inngest, OpenAI, and
            our analytics and error-monitoring providers where needed to operate the website and services. They may
            process information only for the functions we ask them to perform and under their applicable contractual
            and security controls. We limit browser-visible data, protect provider access with server-side or local
            credentials, and do not place your contact details in booking links.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Retention, security, and your choices</h2>
          <p className={paragraphClassName}>
            We retain information only for as long as it is reasonably needed for the purposes described above,
            contractual or operational records, security, dispute resolution, and applicable legal obligations. We
            use access controls and credential-protection measures appropriate to the information and service.
          </p>
          <p className={paragraphClassName}>
            To ask about, access, correct, or request deletion of your information, email{" "}
            <a className="font-semibold text-[#6f1fd1] underline underline-offset-2" href="mailto:enquiries@arcaniumdigital.com">
              enquiries@arcaniumdigital.com
            </a>
            . We may need to retain information where required for security, legal, or contractual reasons.
          </p>
        </section>

        <p className="mt-10 text-sm text-black/45">Version: privacy-v2 · Effective 20 September 2026</p>
      </article>
    </main>
  );
}
