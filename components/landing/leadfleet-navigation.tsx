"use client";

import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import styles from "@/app/home.module.css";

const links = [["System", "#system"], ["Difference", "#difference"], ["Proof", "#proof"], ["Clients", "#clients"]] as const;

export function LeadfleetNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  return (
    <header className={styles.navigation}>
      <a href="#" className={styles.logoLink}>
        <Image src="/images/brand/logo-ad.png" alt="" width={40} height={40} priority />
        <span className={styles.wordmark}>ARCANIUM<span>DIGITAL</span></span>
      </a>
      <nav className={styles.desktopNav} aria-label="Primary navigation">
        {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - redesigned header" className={styles.navCta}>
        Free growth plan <ArrowRight aria-hidden="true" />
      </MetaTrackedLink>
      <button type="button" className={styles.menuButton} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          <MetaTrackedLink href="#audit" trackingLabel="Seller Pipeline Audit - mobile menu" onClick={() => setOpen(false)}>Free growth plan</MetaTrackedLink>
        </nav>
      )}
    </header>
  );
}
