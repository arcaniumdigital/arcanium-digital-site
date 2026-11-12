import { AuthoritySection } from "@/components/landing/authority-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { FoundersNoteSection } from "@/components/landing/founders-note-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { Navigation } from "@/components/landing/navigation";
import { LeadComparisonSection, PipelineAuditSection, SellerPathsSection, SellerProofSection, SellerSystemSection } from "@/components/landing/seller-pipeline-sections";

export function LegacyHomepage({ structuredData }: { structuredData: unknown }) {
  return <><Navigation /><main className="relative min-h-screen overflow-x-hidden"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><HeroSection /><LogoCarousel /><CtaSection /><LeadComparisonSection /><SellerSystemSection /><SellerPathsSection /><SellerProofSection /><AuthoritySection /><PipelineAuditSection /><FoundersNoteSection /><FinalCtaSection /></main><footer className="pipeline-footer"><a href="#" aria-label="Arcanium Digital home">ARCANIUM DIGITAL</a><p>Seller enquiries. Real conversations. Clear next steps.</p><a href="/privacy">Privacy Policy</a></footer></>;
}

