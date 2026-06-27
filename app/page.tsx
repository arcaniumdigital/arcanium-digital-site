import type { Metadata } from "next";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { VslSection } from "@/components/landing/vsl-section";
import { MechanismSection } from "@/components/landing/mechanism-section";
import { AutonomousSection } from "@/components/landing/autonomous-section";
import { ConnectEverythingSection } from "@/components/landing/connect-everything-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { VideoTestimonialSection } from "@/components/landing/video-testimonial-section";
import { AuthoritySection } from "@/components/landing/authority-section";
import { AnalyticsSection } from "@/components/landing/analytics-section";
import { FaqSection, faqs } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Personalised Websites for Real Estate Agents",
  description:
    "Arcanium Digital builds personalised real estate agent websites that showcase recent sales, testimonials, suburb expertise, property marketing, and seller booking paths.",
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
    title: "Personalised Websites for Real Estate Agents",
    description:
      "Turn an agent's online presence into a lead-generating asset for local seller enquiries.",
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
      "Personalised websites for real estate agents that build trust, prove local authority, and convert visitors into appraisal or listing enquiries.",
    provider: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
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
      <VslSection />
      <div className="hidden" aria-hidden="true">
        <MechanismSection />
      </div>
      <AutonomousSection />
      <HowItWorksSection />
      <VideoTestimonialSection />
      <AuthoritySection />
      <AnalyticsSection />
      <ConnectEverythingSection />
      <CtaSection />
      <FaqSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  );
}
