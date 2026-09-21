import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { AutonomousSection } from "@/components/landing/autonomous-section";
import { AuthoritySection } from "@/components/landing/authority-section";
import { AnalyticsSection } from "@/components/landing/analytics-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { GeoSection } from "@/components/landing/geo-section";
import { Navigation } from "@/components/landing/navigation";
import { WhatWeDoSection } from "@/components/landing/what-we-do-section";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Appear in Front of Vendors Ready to Sell",
  description:
    "Done-for-you Google Ads and online visibility for real estate agents who want more opportunities to speak with local vendors.",
  keywords: [
    "real estate agent websites",
    "real estate landing page",
    "agent personal website",
    "real estate vendor leads",
    "real estate listing website",
    "real estate SEO",
    "real estate agent branding",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Appear in Front of Vendors Ready to Sell",
    description:
      "Discover where local vendor leads may be going to competitors and how Google Ads and a stronger online presence can help.",
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
    serviceType: "Google Ads and online lead generation for real estate agents",
    url: siteUrl,
    description:
      "Done-for-you Google Ads, website and local visibility services for real estate agents seeking more vendor enquiries.",
    provider: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  },
];

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="relative min-h-screen overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <HeroSection />
        <CtaSection />
        <WhatWeDoSection />
        <AutonomousSection />
        <AnalyticsSection />
        <GeoSection />
        <AuthoritySection />
        <FinalCtaSection />
      </main>
    </>
  );
}
