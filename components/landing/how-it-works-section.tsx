"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Position",
    subtitle: "your market",
    description:
      "Clarify the sellers you want, the suburbs you want to own, and the proof that makes you the safer choice.",
  },
  {
    number: "02",
    title: "Build",
    subtitle: "the site",
    description:
      "Turn your reviews, sales, story, process, and appraisal offer into a page sellers can trust before they ever speak to you.",
  },
  {
    number: "03",
    title: "Convert",
    subtitle: "& improve",
    description:
      "Launch with a clean booking path, source tracking, and the data needed to see which proof is creating real seller intent.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden bg-[oklch(0.09_0.01_260)] py-24 text-white lg:py-32"
    >
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-white/[0.02] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="relative mb-0 grid items-end gap-4 lg:mb-0 lg:grid-cols-2 lg:gap-12">
          <div className="overflow-hidden pb-0 lg:pb-32">
            <h2
              className={`font-display text-6xl leading-[0.85] tracking-tight transition-all delay-100 duration-1000 md:text-7xl lg:text-[128px] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
              }`}
            >
              <span className="block">Position.</span>
              <span className="block text-white/30">Build.</span>
              <span className="block text-white/10">Convert.</span>
            </h2>
          </div>

          <div
            className={`relative h-[320px] overflow-hidden transition-all delay-200 duration-1000 lg:h-[640px] ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tree-uAia6REvB137CQyHFCf0za3O6h2zKO.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-full w-full object-contain object-bottom"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.01_260)] via-transparent to-transparent" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative border p-8 text-left transition-all duration-500 lg:p-12 ${
                activeStep === index
                  ? "border-white/60 bg-[#000000]"
                  : "border-white/25 bg-[#000000] hover:border-white/50"
              }`}
            >
              <div className="mb-8 flex items-center gap-4">
                <span
                  className={`font-display text-4xl transition-colors duration-300 ${
                    activeStep === index ? "text-[#eca8d6]" : "text-white/20"
                  }`}
                >
                  {step.number}
                </span>
                <div className="h-px flex-1 overflow-hidden bg-white/10">
                  {activeStep === index && <div className="h-full bg-[#eca8d6]/50 animate-progress" />}
                </div>
              </div>

              <h3 className="mb-2 font-display text-3xl lg:text-4xl">{step.title}</h3>
              <span className="mb-6 block font-display text-xl text-white/40">{step.subtitle}</span>

              <p
                className={`leading-relaxed text-white/60 transition-opacity duration-300 ${
                  activeStep === index ? "opacity-100" : "opacity-60"
                }`}
              >
                {step.description}
              </p>

              <div
                className={`absolute bottom-0 left-0 right-0 h-1 origin-left bg-[#eca8d6] transition-transform duration-500 ${
                  activeStep === index ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-progress {
          animation: progress 6s linear forwards;
        }
      `}</style>
    </section>
  );
}
