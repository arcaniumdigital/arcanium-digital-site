"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./client-showcase.module.css";

const clients = [
  { name:"Mary-Ann McLoughlin", area:"Sunshine Coast, QLD", title:"One connected seller journey.", body:"Campaign, conversation and follow-up designed to work together.", tags:["Campaign","AI follow-up"], image:"/images/showcase/mary-ann-results.png", alt:"Mary-Ann McLoughlin campaign showcase" },
  { name:"Kael Sharp", area:"Castle Hill, NSW", title:"Fast response. Clear next step.", body:"A direct path from homeowner interest to an available appraisal.", tags:["Seller enquiries","Appraisal booking"], image:"/images/showcase/built-for-google-ai-search.png", alt:"Kael Sharp digital campaign showcase" },
  { name:"Shana Feng", area:"Brisbane, QLD", title:"Built around the local market.", body:"A considered acquisition system shaped around the agent and their area.", tags:["Local strategy","Consistent nurture"], image:"/images/showcase/suburb-search-opportunity-light.png", alt:"Shana Feng local campaign showcase" },
];

export function ClientShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((value) => (value + 1) % clients.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div className={styles.showcase} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className={styles.stage}>
        <div className={styles.copy} aria-live="polite">
          {clients.map((item,index)=><article key={item.name} className={index===active?styles.activePanel:styles.panel} aria-hidden={index!==active}>
            <p className={styles.identity}><strong>{item.name}</strong><span>{item.area}</span></p>
            <div className={styles.story}><h3>{item.title}</h3><p>{item.body}</p><ul>{item.tags.map(tag=><li key={tag}>{tag}</li>)}</ul></div>
          </article>)}
        </div>
        <div className={styles.media}>
          {clients.map((item,index)=><figure key={item.name} className={index===active?styles.activeImage:styles.image} aria-hidden={index!==active}><Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 100vw, 660px" /></figure>)}
        </div>
      </div>
      <div className={styles.controls} aria-label="Choose a client story">
        {clients.map((item,index)=><button key={item.name} type="button" className={index===active?styles.activeControl:styles.control} aria-label={`Show ${item.name}`} aria-pressed={index===active} onClick={()=>setActive(index)}><span /></button>)}
      </div>
    </div>
  );
}
