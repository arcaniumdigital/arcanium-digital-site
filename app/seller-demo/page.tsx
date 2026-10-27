import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <main className={styles.shell}>
        <Link href="/" className={styles.brand} aria-label="Arcanium Digital home">
          <Image src="/images/brand/logo-ad.png" alt="" width={30} height={30} />
          <span>Arcanium Digital</span>
        </Link>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Demo</span>
          <h1>Try the AI setter</h1>
          <p>See how it handles a seller enquiry. Use your own mobile and fictional property details.</p>
        </div>
        <SellerDemo />
      </main>
    </div>
  );
}
