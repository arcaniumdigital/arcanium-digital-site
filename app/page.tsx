import type { Metadata } from "next";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { MechanismSection } from "@/components/landing/mechanism-section";
import { AutonomousSection } from "@/components/landing/autonomous-section";
import { ConnectEverythingSection } from "@/components/landing/connect-everything-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { AuthoritySection } from "@/components/landing/authority-section";
import { AnalyticsSection } from "@/components/landing/analytics-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Real Estate Agent Websites Built for More Appraisals",
  description:
    "Arcanium Digital builds personalised real estate agent websites that turn proof, reviews, local authority, and seller intent into booked appraisal conversations.",
  keywords: [
    "real estate agent websites",
    "real estate landing page",
    "agent personal website",
    "real estate seller leads",
    "property appraisal website",
    "real estate SEO",
    "real estate agent branding",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Real Estate Agent Websites Built for More Appraisals",
    description:
      "Turn an agent's online presence into a trust-building path for local seller enquiries.",
    url: siteUrl,
    siteName,
    type: "website",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: siteName,
    serviceType: "Real estate agent website design and lead generation",
    url: siteUrl,
    description:
      "Personalised websites for real estate agents that build trust, prove local authority, and convert visitors into appraisal conversations.",
    provider: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />
      <HeroSection />
      <div className="hidden" aria-hidden="true">
        <MechanismSection />
      </div>
      <AutonomousSection />
      <HowItWorksSection />
      <AuthoritySection />
      <AnalyticsSection />
      <CtaSection />
      <ConnectEverythingSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  );
}
