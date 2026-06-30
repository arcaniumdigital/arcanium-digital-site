"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";

const showcaseImages = [
  {
    label: "Authority",
    image: "/images/showcase/mary-ann.png",
  },
  {
    label: "Positioning",
    image: "/images/showcase/mary-ann-strategy.png",
  },
  {
    label: "Proof",
    image: "/images/showcase/mary-ann-results.png",
  },
];

const showcaseDetails = {
  agent: "Mary-Ann McLoughlin",
  market: "Sunshine Coast",
  focus: "Premium seller positioning",
  headline: "A focused example of how an agent site can package story, proof, listings, and the appraisal path without feeling cluttered.",
  notes: ["Local authority", "Seller proof", "Clear next step"],
  liveUrl: "https://maryannmcloughlin.com",
};

function SiteMockup({ image }: { image: (typeof showcaseImages)[number] }) {
  return (
    <div className="relative overflow-hidden border border-white/15 bg-black text-white shadow-2xl shadow-black/30">
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/35" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/10" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          agent site
        </span>
      </div>

      <div className="relative overflow-hidden bg-white">
        <img
          src={image.image}
          alt={`Mary-Ann McLoughlin example website ${image.label.toLowerCase()} screenshot`}
          className="aspect-[16/9] w-full object-cover object-top"
        />
      </div>
    </div>
  );
}

export function AutonomousSection() {
  const [isVisible, setIsVisible] = useState(false);
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
    <section id="showcase" ref={sectionRef} className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2
              className={`font-display text-5xl leading-[0.95] tracking-tight transition-all duration-1000 md:text-7xl lg:text-[112px] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              The seller
              <br />
              <span className="text-muted-foreground">conversion machine.</span>
            </h2>
          </div>
          <p
            className={`text-lg leading-relaxed text-muted-foreground transition-all delay-100 duration-1000 lg:col-span-5 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            Not a brochure. A premium path that turns attention into trust, trust into appraisal intent, and appraisal intent into a booked conversation.
          </p>
        </div>

        <div
          className={`mx-auto max-w-6xl transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
            {showcaseImages.map((image) => (
              <div key={image.label} className="w-[82vw] shrink-0 snap-center md:w-auto">
                <SiteMockup image={image} />
              </div>
            ))}
          </div>

          <div
            className="mt-5 border border-foreground/10 bg-background p-6 transition-all duration-500 lg:p-7"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {showcaseDetails.market}
                </span>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-3xl leading-none md:text-4xl">{showcaseDetails.agent}</h3>
                  <span className="border border-foreground/10 px-3 py-1 text-xs text-muted-foreground">
                    {showcaseDetails.focus}
                  </span>
                </div>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {showcaseDetails.headline}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {showcaseDetails.notes.map((note) => (
                    <span key={note} className="border border-foreground/10 px-2.5 py-1 text-xs text-muted-foreground">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={showcaseDetails.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-11 items-center justify-center rounded-full border border-foreground/15 px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  View live site
                  <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="#cta"
                  className="group inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
                >
                  Make me one
                  <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
