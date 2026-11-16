import type { Metadata } from "next";
import { Navigation } from "@/components/landing/navigation";
import { CaseStudyVideo } from "@/components/landing/case-study-video";

export const metadata: Metadata = {
  title: "Case Study",
  description: "Watch the More Vendors case study.",
  robots: { index: false, follow: true },
};

export default function CaseStudyPage() {
  return <>
    <Navigation />
    <main className="mv-case-study-page mv-shell">
      <h1>Case Study</h1>
      <CaseStudyVideo />
      <a href="/" className="mv-button mv-primary-cta mv-case-study-learn-more">Learn More<svg className="mv-cta-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></a>
    </main>
    <footer className="mv-footer mv-shell"><a href="/">More Vendors</a><span>© {new Date().getFullYear()} Arcanium Digital</span><a href="/privacy">Privacy Policy</a></footer>
  </>;
}
