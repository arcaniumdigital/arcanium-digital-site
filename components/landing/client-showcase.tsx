"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./client-showcase.module.css";

const clients = [
  {
    name: "Mary-Ann McLoughlin",
    area: "Sunshine Coast, QLD",
    label: "Seller pipeline",
    headline: "Campaign to conversation",
    detail: "A connected journey that keeps every seller enquiry moving toward a useful next step.",
    image: "/images/showcase/mary-ann-results.png",
    alt: "Mary-Ann McLoughlin seller campaign results",
  },
  {
    name: "Kael Sharp",
    area: "Castle Hill, NSW",
    label: "Appraisal journey",
    headline: "Enquiry to appointment",
    detail: "Fast replies, clear choices and a direct route from first interest to an appraisal.",
    image: "/images/seller-pipeline/ai-conversation.png",
    alt: "Kael Sharp seller conversation journey",
  },
  {
    name: "Shana Feng",
    area: "Brisbane, QLD",
    label: "Local opportunity",
    headline: "Built for the market",
    detail: "A considered acquisition system shaped around the agent, the area and the homeowner.",
    image: "/images/showcase/suburb-search-opportunity-light.png",
    alt: "Shana Feng local seller opportunity system",
  },
];

export function ClientShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % clients.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className={styles.showcase}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.copyPanel} aria-live="polite">
        {clients.map((client, index) => (
          <article
            key={client.name}
            className={index === active ? styles.activeCopy : styles.copy}
            aria-hidden={index !== active}
          >
            <div className={styles.identity}>
              <strong>{client.name}</strong>
              <span>{client.area}</span>
            </div>
            <div className={styles.result}>
              <span>{client.label}</span>
              <h3>{client.headline}</h3>
              <p>{client.detail}</p>
            </div>
          </article>
        ))}
        <div className={styles.controls} aria-label="Choose a client story">
          {clients.map((client, index) => (
            <button
              key={client.name}
              type="button"
              className={index === active ? styles.activeDot : styles.dot}
              aria-label={`Show ${client.name}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.mediaPanel}>
        {clients.map((client, index) => (
          <figure
            key={client.name}
            className={index === active ? styles.activeMedia : styles.media}
            aria-hidden={index !== active}
          >
            <Image src={client.image} alt={client.alt} fill sizes="(max-width: 800px) 100vw, 62vw" />
          </figure>
        ))}
        <div className={styles.frame} aria-hidden="true" />
        <div className={styles.counter} aria-hidden="true">
          <span>0{active + 1}</span><i /><span>0{clients.length}</span>
        </div>
      </div>
    </div>
  );
}
