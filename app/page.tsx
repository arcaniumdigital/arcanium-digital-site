import type { Metadata } from "next";
import { HybridHomepage } from "@/components/landing/hybrid-homepage";
import { LegacyHomepage } from "@/components/landing/legacy-homepage";
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
  const useHybridHomepage = process.env.NEXT_PUBLIC_HOMEPAGE_VARIANT === "hybrid";
  return useHybridHomepage
    ? <HybridHomepage structuredData={structuredData} />
    : <LegacyHomepage structuredData={structuredData} />;
}

