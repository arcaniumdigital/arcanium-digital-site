import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { AuthoritySection } from "@/components/landing/authority-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Navigation } from "@/components/landing/navigation";
import { FaqSection } from "@/components/landing/faq-section";
import { LeadComparisonSection, SellerSystemSection, SellerPathsSection, SellerProofSection, PipelineAuditSection } from "@/components/landing/seller-pipeline-sections";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Done for YOU booked APPRAISALS",
  description: siteDescription,
  keywords: ["real estate seller leads", "booked appraisals", "AI appointment setting for real estate agents", "seller pipeline audit"],
  alternates: { canonical: siteUrl },
  openGraph: { title: "Done for YOU booked APPRAISALS", description: siteDescription, url: siteUrl, siteName, type: "website" },
};

const structuredData = [
  { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: siteUrl, description: siteDescription },
  { "@context": "https://schema.org", "@type": "Service", name: "Arcanium Seller Pipeline", serviceType: "Homeowner lead generation, AI qualification, appointment setting and seller nurture", url: siteUrl, description: siteDescription, provider: { "@type": "Organization", name: siteName, url: siteUrl } },
];

export default function Home() {
  return <><Navigation /><main className="relative min-h-screen overflow-x-hidden"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><HeroSection /><CtaSection /><LeadComparisonSection /><SellerSystemSection /><SellerPathsSection /><SellerProofSection /><AuthoritySection /><PipelineAuditSection /><FaqSection /><FinalCtaSection /></main><footer className="pipeline-footer"><a href="#" aria-label="Arcanium Digital home">ARCANIUM DIGITAL</a><p>Seller enquiries. Real conversations. Clear next steps.</p><a href="/privacy">Privacy Policy</a></footer></>;
}
