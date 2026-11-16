import { CaseStudySection } from "@/components/landing/case-study-video";
import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { AuthoritySection } from "@/components/landing/authority-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Navigation } from "@/components/landing/navigation";
import { SellerSystemSection, SellerProofSection } from "@/components/landing/seller-pipeline-sections";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Done for You Lead Gen to Booked Appraisals",
  description: siteDescription,
  keywords: ["real estate seller leads", "booked appraisals", "AI appointment setting for real estate agents", "seller pipeline audit"],
  alternates: { canonical: siteUrl },
  openGraph: { title: "Done for You Lead Gen to Booked Appraisals", description: siteDescription, url: siteUrl, siteName, type: "website" },
};

const structuredData = [
  { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: siteUrl, description: siteDescription },
  { "@context": "https://schema.org", "@type": "Service", name: "Arcanium Seller Pipeline", serviceType: "Homeowner lead generation, AI qualification, appointment setting and seller nurture", url: siteUrl, description: siteDescription, provider: { "@type": "Organization", name: siteName, url: siteUrl } },
];

export default function Home() {
  return <><Navigation /><main className="mv-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><HeroSection /><CtaSection /><SellerSystemSection /><CaseStudySection /><SellerProofSection /><AuthoritySection /><FinalCtaSection /></main><footer className="mv-footer mv-shell"><a href="/">More Vendors</a><span>© {new Date().getFullYear()} Arcanium Digital</span><a href="/privacy">Privacy Policy</a></footer></>;
}
