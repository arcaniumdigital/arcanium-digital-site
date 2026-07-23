"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const navLinks = [
  { name: "Video", href: "#vsl" },
  { name: "Proof", href: "#testimonials" },
  { name: "Audit", href: "#audit" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-4 z-50 px-4">
      <nav
        className={`mx-auto flex h-14 max-w-[720px] items-center justify-between rounded-full border px-4 backdrop-blur-xl transition-all duration-300 ${
          isScrolled
            ? "border-black/10 bg-white/86 shadow-[0_18px_50px_rgba(32,20,48,0.12)]"
            : "border-black/8 bg-white/70 shadow-[0_12px_40px_rgba(32,20,48,0.08)]"
        }`}
      >
        <a href="#" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#8f33ff] p-1">
            <img
              src="/images/brand/logo-ad.png"
              alt="Arcanium Digital"
              className="h-full w-full scale-[1.55] object-contain mix-blend-screen"
            />
          </span>
          <span className="hidden font-display text-sm font-semibold tracking-tight text-[#151319] sm:inline">
            Arcanium Digital
          </span>
        </a>

        <div className="hidden items-center gap-5 sm:flex">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#151319]/55 transition-colors hover:text-[#8f33ff]">
              {link.name}
            </a>
          ))}
        </div>

        <a
          href="#audit"
          className="group inline-flex h-10 items-center justify-center rounded-full bg-[#8f33ff] px-4 text-sm font-bold text-white shadow-[0_10px_28px_rgba(143,51,255,0.28)] transition-colors hover:bg-[#7b25e8]"
        >
          Get audit
          <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </nav>
    </header>
  );
}
