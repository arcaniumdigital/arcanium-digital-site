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
  title: "Become the #1 Real Estate Agent Online in Your Suburb",
  description:
    "Build visibility across Google Search, Google Maps and AI platforms so local vendors find your name first.",
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
    title: "Real Estate Agent Websites Built for More Vendors",
    description:
      "Turn an agent's online presence into a trust-building path for local vendor and listing enquiries.",
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
      "Personalised websites for real estate agents that build trust, prove local authority, and convert visitors into vendor and listing conversations.",
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
        <AnalyticsSection />
        <GeoSection />
        <AutonomousSection />
        <AuthoritySection />
        <FinalCtaSection />
      </main>
    </>
  );
}
