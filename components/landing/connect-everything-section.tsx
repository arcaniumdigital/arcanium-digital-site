"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  DatabaseZap,
  Home,
  MapPinned,
  Star,
} from "lucide-react";

const integrations = [
  { name: "Listings", category: "Proof", icon: Home },
  { name: "Reviews", category: "Trust", icon: Star },
  { name: "Calendar", category: "Bookings", icon: CalendarDays },
  { name: "CRM", category: "Lead routing", icon: DatabaseZap },
  { name: "Analytics", category: "Tracking", icon: BarChart3 },
  { name: "Google Business", category: "Local", icon: MapPinned },
];

export function ConnectEverythingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="connect" ref={sectionRef} className="relative overflow-hidden">
      <div className="relative z-10 pt-24 text-center lg:pt-32">
        <span
          className={`mb-8 inline-flex items-center justify-center gap-4 font-mono text-sm text-muted-foreground transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="h-px w-12 bg-foreground/20" />
          Connections
          <span className="h-px w-12 bg-foreground/20" />
        </span>

        <h2
          className={`font-display text-6xl leading-[0.9] tracking-tight transition-all duration-1000 md:text-7xl lg:text-[128px] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          Keep the
          <br />
          <span className="text-muted-foreground">momentum.</span>
        </h2>

        <p
          className={`mx-auto mt-8 max-w-xl text-xl leading-relaxed text-muted-foreground transition-all delay-100 duration-1000 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          After a seller books, the site can keep the important pieces connected: listings, reviews, calendar, CRM, analytics, and local search visibility.
        </p>
      </div>

      <div
        className={`relative left-1/2 -mt-10 w-screen -translate-x-1/2 transition-all delay-200 duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/connection-KeJwWPQvn6l0a7C48tCARYtNEdC92H.png"
          alt=""
          aria-hidden="true"
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto -mt-4 max-w-[1400px] px-6 pb-24 lg:-mt-24 lg:px-12 lg:pb-32">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className={`group relative cursor-default overflow-hidden border p-5 transition-all duration-500 lg:p-7 ${
                hoveredIndex === index
                  ? "scale-[1.02] border-foreground bg-foreground/[0.04]"
                  : "border-foreground/10 hover:border-foreground/30"
              } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
              style={{ transitionDelay: `${index * 30 + 300}ms` }}
              onMouseEnter={(event) => {
                setHoveredIndex(index);
                const rect = event.currentTarget.getBoundingClientRect();
                setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
              }}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setMousePos(null);
              }}
            >
              {hoveredIndex === index && mousePos && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.12) 0%, transparent 70%)`,
                  }}
                />
              )}

              <span
                className={`absolute right-3 top-3 px-2 py-0.5 font-mono text-[10px] transition-colors ${
                  hoveredIndex === index
                    ? "bg-foreground text-background"
                    : "bg-foreground/10 text-muted-foreground"
                }`}
              >
                {integration.category}
              </span>

              <div
                className={`mb-6 flex size-10 items-center justify-center transition-colors ${
                  hoveredIndex === index ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <integration.icon className="size-6" />
              </div>

              <span className="relative z-10 block font-medium">{integration.name}</span>

              <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden bg-foreground/20">
                <div
                  className={`h-full bg-foreground transition-all duration-500 ${
                    hoveredIndex === index ? "w-full" : "w-0"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
