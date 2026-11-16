import type { Metadata } from "next";
import { LeadFleetReference } from "@/components/leadfleet-reference/leadfleet-reference";

export const metadata: Metadata = {
  title: "Lead Generation Website Reference | Arcanium Digital",
  description: "A private Arcanium reference build for reviewing premium real-estate lead generation page patterns.",
  robots: { index: false, follow: false },
};

export default function LeadFleetReferencePage() {
  return <LeadFleetReference />;
}
