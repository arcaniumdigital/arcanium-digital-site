"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { name: "VSL",           href: "#vsl"           },
  { name: "Showcase",      href: "#showcase"      },
  { name: "Reviews",       href: "#testimonials"  },
  { name: "Analytics",     href: "#analytics"     },
  { name: "Connect",       href: "#connect"       },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-4 right-4" 
          : "top-0 left-0 right-0"
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className={`font-display tracking-tight transition-all duration-500 ${isScrolled ? "text-xl text-foreground" : "text-2xl text-white"}`}>Arcanium Digital</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm transition-colors duration-300 relative group ${isScrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-foreground" : "bg-white"}`} />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#vsl" className={`transition-all duration-500 ${isScrolled ? "text-xs text-foreground/70 hover:text-foreground" : "text-sm text-white/70 hover:text-white"}`}>
              Watch proof
            </a>
            <a
              href="#cta"
              className={`inline-flex items-center justify-center rounded-full font-medium transition-all duration-500 ${isScrolled ? "h-8 bg-foreground px-4 text-xs text-background hover:bg-foreground/90" : "h-9 bg-white px-6 text-sm text-black hover:bg-white/90"}`}
            >
              Press me
            </a>
          </div>

          <a
            href="#cta"
            className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all duration-500 md:hidden ${
              isScrolled ? "bg-foreground text-background" : "bg-white text-black"
            }`}
          >
            Press me
          </a>
        </div>

      </nav>
    </header>
  );
}
