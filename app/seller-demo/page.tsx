import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { SellerDemo } from "@/components/seller-demo/seller-demo";
import styles from "./seller-demo.module.css";

export const metadata: Metadata = {
  title: "Try the Seller Conversation Demo",
  description: "Try Arcanium Digital's seller enquiry demonstration by SMS or isolated website chat. No real bookings.",
  robots: {index: false, follow: false, noarchive: true},
  alternates: {canonical: "/seller-demo"},
};

export default function SellerDemoPage() {
  const publicSms = process.env.SELLER_DEMO_MODE === "public";
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
          <p>Try a seller enquiry as a curious homeowner or someone thinking of selling. {publicSms ? "Start below and continue the demonstration on your phone." : "The SMS demo is restricted to the owner’s approved mobile."}</p>
          <div className={styles.safety}><ShieldCheck size={19} aria-hidden="true" /><span>{publicSms ? "SMS only to the mobile you submit with your consent. No emails, real bookings or agent notifications." : "Owner-only SMS testing. Only the approved test mobile is eligible. No emails, real bookings or client notifications."}</span></div>
        </div>
        <SellerDemo publicSms={publicSms} />
        <footer className={styles.footer}>
          <p>This is an isolated conversation demo, not a live enquiry to Kael or another client. Appointment examples are illustrative, not real availability.</p>
          <p>Arcanium Digital and GoHighLevel process demo enquiries and conversations. Phone and address fields are not copied into the optional website chat. This does not test production lead delivery, reminders or listing-outcome workflows. <Link href="/privacy">Privacy</Link></p>
        </footer>
      </main>
    </div>
  );
}
