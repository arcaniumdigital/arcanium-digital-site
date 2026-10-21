import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { SellerDemo } from "@/components/seller-demo/seller-demo";
import styles from "./seller-demo.module.css";

export const metadata: Metadata = {
  title: "Try the Seller Conversation Demo",
  description: "Try a practice seller enquiry and chat with Arcanium Digital's demonstration property assistant. No SMS, emails or real bookings.",
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
          <p>Start with a practice enquiry, then chat as a curious homeowner, a future seller or someone ready for an appraisal.</p>
          <div className={styles.safety}><ShieldCheck size={19} aria-hidden="true" /><span>Demo only. No SMS, emails or real calendar bookings.</span></div>
        </div>
        <SellerDemo />
        <footer className={styles.footer}>
          <p>This is an isolated conversation demo, not a live enquiry to Kael or another client. Appointment examples are illustrative, not real availability.</p>
          <p>Chat messages are processed by Arcanium Digital and GoHighLevel. Use fictional details. This does not test production lead delivery, reminders or listing-outcome workflows. <Link href="/privacy">Privacy</Link></p>
        </footer>
      </main>
    </div>
  );
}
