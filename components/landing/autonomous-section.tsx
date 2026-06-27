"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";

const showcaseImages = [
  {
    label: "Hero",
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
  headline:
    "A live example of how one agent's market, story, proof, and appraisal call-to-action can feel premium without making the path complicated.",
  notes: ["Seller journey", "Appraisal CTA", "Local proof", "Live example"],
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
  const [activeSite, setActiveSite] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSite((prev) => (prev + 1) % showcaseImages.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  const active = showcaseImages[activeSite];

  return (
    <section id="showcase" ref={sectionRef} className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span
              className={`mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground transition-all duration-700 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="h-px w-10 bg-foreground/30" />
              Example site showcase
            </span>
            <h2
              className={`font-display text-5xl leading-[0.95] tracking-tight transition-all duration-1000 md:text-7xl lg:text-[112px] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              A site sellers can
              <br />
              <span className="text-muted-foreground">understand fast.</span>
            </h2>
          </div>
          <p
            className={`text-lg leading-relaxed text-muted-foreground transition-all delay-100 duration-1000 lg:col-span-5 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            The goal is not a prettier brochure. It is one focused place where sellers can understand the agent, see the proof, and take the next step.
          </p>
        </div>

        <div
          className={`mx-auto max-w-6xl transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <SiteMockup image={active} />

          <div
            className="border-x border-b border-foreground/10 bg-background p-6 transition-all duration-500 lg:p-8"
          >
            <div className="grid min-h-[230px] gap-6 sm:min-h-[200px] lg:min-h-[190px]">
              <div>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {showcaseDetails.market}
                </span>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-4xl leading-none md:text-5xl">{showcaseDetails.agent}</h3>
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
                  <a
                    href={showcaseDetails.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-foreground transition-opacity hover:opacity-70"
                  >
                    View the live Mary-Ann site
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-5">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {String(activeSite + 1).padStart(2, "0")} / {String(showcaseImages.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                {showcaseImages.map((image, index) => (
                  <button
                    key={image.label}
                    type="button"
                    onClick={() => setActiveSite(index)}
                    aria-label={`Show ${image.label.toLowerCase()} example`}
                    className={`h-2 rounded-full transition-all ${
                      activeSite === index ? "w-8 bg-foreground" : "w-2 bg-foreground/20 hover:bg-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="#cta"
              className="group inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Make me one
              <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
