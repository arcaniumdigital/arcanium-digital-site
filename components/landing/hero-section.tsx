"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";

const words = ["appraisals", "listings", "trust", "seller calls"];
const proofPoints = ["60-minute appraisal growth call", "No existing website needed", "Built to turn proof into enquiries"];

function BlurWord({ word }: { word: string }) {
  return (
    <>
      <span key={word} className="hero-word inline-block">
        {word}
      </span>
      <style jsx>{`
        .hero-word {
          background: linear-gradient(90deg, #eca8d6, #a78bfa, #67e8f9, #fbbf24);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1.16;
          padding-bottom: 0.14em;
          animation: word-reveal 720ms cubic-bezier(0.22, 1, 0.36, 1) forwards,
            word-settle 420ms ease 680ms forwards;
        }

        @keyframes word-reveal {
          from {
            opacity: 0;
            filter: blur(18px);
            transform: translateY(0.08em);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @keyframes word-settle {
          to {
            color: white;
            -webkit-text-fill-color: white;
          }
        }
      `}</style>
    </>
  );
}

function HeroVideoCard({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="group relative overflow-hidden border border-white/15 bg-black shadow-2xl shadow-black/40">
        <div className="relative aspect-[4/3] bg-black">
          <div
            className="hero-wistia-player h-full w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<wistia-player media-id="43wdr7dw38" wistia-popover="true" aspect="1.3333333333333333"></wistia-player>',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-90 transition-opacity group-hover:opacity-65" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid size-20 place-items-center rounded-full border border-white/25 bg-white/18 text-white shadow-2xl shadow-black/40 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
              <PlayCircle className="size-10 fill-white/20" />
            </span>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/78 p-4 text-white backdrop-blur-md">
          <p className="mb-2 font-display text-xl leading-none">Watch the appraisal growth breakdown</p>
          <p className="text-sm leading-relaxed text-white/70">
            See how an agent site turns attention, proof, and local authority into booked seller conversations.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col items-start justify-center overflow-hidden bg-black">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/43wdr7dw38.js"
        strategy="afterInteractive"
        type="module"
      />
      <style jsx global>{`
        .hero-wistia-player wistia-player[media-id="43wdr7dw38"] {
          display: block;
          height: 100%;
          width: 100%;
        }

        .hero-wistia-player wistia-player[media-id="43wdr7dw38"]:not(:defined) {
          background: center / cover no-repeat url("https://fast.wistia.com/embed/medias/43wdr7dw38/swatch");
          display: block;
          filter: blur(5px);
          height: 100%;
          width: 100%;
        }
      `}</style>

      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="h-full w-[170%] max-w-none translate-x-[3%] -translate-y-[12%] scale-[1.7] object-contain object-center opacity-35 md:w-full md:translate-x-0 md:translate-y-0 md:scale-100 md:object-cover md:object-center md:opacity-50"
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/78" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden opacity-20">
        {[...Array(8)].map((_, index) => (
          <div
            key={`h-${index}`}
            className="absolute h-px bg-white/10"
            style={{ top: `${12.5 * (index + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, index) => (
          <div
            key={`v-${index}`}
            className="absolute w-px bg-white/10"
            style={{ left: `${8.33 * (index + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-16 pt-28 lg:px-12 lg:pb-24 lg:pt-36">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-center">
          <div className="max-w-4xl">
          <h1
            className={`max-w-5xl overflow-visible text-left font-display text-[clamp(3rem,7vw,7.5rem)] leading-[1.02] tracking-tight text-white transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <span className="block">Do you want more</span>
            <span className="block">
              <span className="relative inline-block">
                <BlurWord word={words[wordIndex]} />
              </span>
              ?
            </span>
          </h1>

          <p
            className={`mt-8 max-w-2xl text-lg leading-relaxed text-white/72 transition-all delay-150 duration-700 md:text-xl ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            Your social posts, referrals, reviews, and recent sales already create attention. We build the site that turns that attention into trust, appraisal intent, and booked seller conversations.
          </p>

          <HeroVideoCard
            className={`mt-8 max-w-xl transition-all delay-200 duration-700 lg:hidden ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          />

          <div
            className={`mt-8 flex flex-col gap-4 transition-all delay-300 duration-700 sm:flex-row lg:mt-10 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            <a
              href="#cta"
              className="group inline-flex h-14 items-center justify-center rounded-full bg-[#eca8d6] px-7 text-sm font-semibold text-black transition-colors hover:bg-[#f1b7e0]"
            >
              I want more appraisals
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#vsl"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Watch proof
            </a>
          </div>

          <div
            className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 transition-all delay-500 duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            {proofPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-2 text-sm text-white/62">
                <CheckCircle2 className="size-4 text-[#eca8d6]" />
                {point}
              </span>
            ))}
          </div>
          </div>

          <HeroVideoCard
            className={`hidden transition-all delay-300 duration-700 lg:block ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          />
        </div>
      </div>
    </section>
  );
}
