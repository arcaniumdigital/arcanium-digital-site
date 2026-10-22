import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { SellerDemo } from "@/components/seller-demo/seller-demo";
import styles from "./seller-demo.module.css";

export const metadata: Metadata = {
  title: "Try the Seller Conversation Demo",
  description: "Try Arcanium Digital's isolated seller enquiry demonstration by SMS. No real bookings or human handoff.",
  robots: {index: false, follow: false, noarchive: true},
  alternates: {canonical: "/seller-demo"},
};

export default function SellerDemoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Arcanium Digital home">
          <Image src="/images/brand/logo-ad.png" alt="" width={40} height={40} />
          <span>Arcanium Digital</span>
        </Link>
        <Link href="/" className={styles.back}>Back to website <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Be the homeowner.<br /><span>Try the conversation.</span></h1>
          <p>Try a seller enquiry as a curious homeowner or someone thinking of selling. Start below and continue the demonstration on your phone.</p>
          <div className={styles.safety}><ShieldCheck size={19} aria-hidden="true" /><span>SMS only to the mobile you submit with your consent. No emails, real bookings, agent notifications, or human handoff.</span></div>
        </div>
        <SellerDemo />
        <footer className={styles.footer}>
          <p>This is an isolated conversation demonstration, not a live real-estate enquiry. Any appointment examples are illustrative and are not real availability.</p>
          <p>Arcanium Digital and GoHighLevel process demo enquiries and SMS conversations. The demo does not send email, notify an agent, or transfer the conversation to a person. <Link href="/privacy">Privacy</Link></p>
        </footer>
      </main>
    </div>
  );
}
