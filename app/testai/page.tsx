import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TestAiForms } from "@/components/testai/test-ai-forms";
import styles from "./testai.module.css";

export const metadata: Metadata = {
  title: "Test Our AI Agents",
  description: "Try Arcanium Digital's AI SMS and voice agents using your own Australian mobile number.",
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: "/testai" },
};

export default function TestAiPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Arcanium Digital home">
          <Image src="/images/brand/logo-ad.png" alt="" width={42} height={42} priority />
          <span>Arcanium Digital</span>
        </Link>
        <Link href="/" className={styles.back}>Back to website <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Don&apos;t watch a demo.<br /><span>Have the conversation.</span></h1>
          <p className={styles.lead}>See how Arcanium follows up with a homeowner by text or voice. Use your own number, choose a test, and experience the agent from the lead&apos;s side.</p>
        </section>

        <section className={styles.demoShell} aria-label="Choose an AI agent demo">
          <div className={styles.demoIntro}>
            <div>
              <p className={styles.kicker}>Two ways to try it</p>
              <h2>Pick the experience you want.</h2>
            </div>
            <p>Both demos are isolated from live client accounts. Your details are used only to deliver the test you request.</p>
          </div>
          <TestAiForms />
        </section>

      </main>

      <footer className={styles.footer}>
        <span>ARCANIUM DIGITAL</span>
        <p>AI follow-up built for real estate.</p>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
