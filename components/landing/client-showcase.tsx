"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./client-showcase.module.css";

const clients = [
  { name:"Mary-Ann McLoughlin", area:"Sunshine Coast, QLD", rating:"Add verified rating", price:"$—", sold:"—", days:"—", image:"/images/showcase/mary-ann-results.png", alt:"Mary-Ann McLoughlin campaign showcase" },
  { name:"Kael Sharp", area:"Castle Hill, NSW", rating:"Add verified rating", price:"$—", sold:"—", days:"—", image:"/images/showcase/built-for-google-ai-search.png", alt:"Kael Sharp digital campaign showcase" },
  { name:"Shana Feng", area:"Brisbane, QLD", rating:"Add verified rating", price:"$—", sold:"—", days:"—", image:"/images/showcase/suburb-search-opportunity-light.png", alt:"Shana Feng local campaign showcase" },
  { name:"Next client", area:"Market area", rating:"Add verified rating", price:"$—", sold:"—", days:"—", image:"/images/seller-pipeline/ai-conversation.png", alt:"Replaceable client campaign placeholder" },
];

export function ClientShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % clients.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className={styles.mock}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.stage}>
        <div className={styles.left} aria-live="polite">
          {clients.map((client, index) => (
            <article key={client.name} className={index === active ? styles.panelActive : styles.panel} aria-hidden={index !== active}>
              <p className={styles.meta}><b>{client.name}</b><span>{client.area}</span><span className={styles.rating}><i aria-hidden="true">★</i>{client.rating}</span></p>
              <p className={styles.big}>{client.price}</p>
              <p className={styles.caption}>Median sold price</p>
              <dl className={styles.stats}>
                <div><dd>{client.sold}</dd><dt>Properties sold, 12 months</dt></div>
                <div><dd>{client.days}</dd><dt>Median days advertised</dt></div>
              </dl>
            </article>
          ))}
        </div>
        <div className={styles.frame}>
          {clients.map((client, index) => (
            <figure key={client.name} className={index === active ? styles.imageActive : styles.image} aria-hidden={index !== active}>
              <Image src={client.image} alt={client.alt} fill sizes="(max-width: 767px) 100vw, 620px" />
            </figure>
          ))}
        </div>
      </div>
      <div className={styles.controls} aria-label="Choose a client story">
        {clients.map((client, index) => (
          <button key={client.name} type="button" className={index === active ? styles.controlActive : styles.control} aria-label={`Show ${client.name}`} aria-pressed={index === active} onClick={() => setActive(index)}>
            <span />
          </button>
        ))}
      </div>
      <p className={styles.source}>Template client metrics. Replace placeholders with verified figures before publishing.</p>
    </div>
  );
}
