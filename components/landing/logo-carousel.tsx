import styles from "./logo-carousel.module.css";

const partnerMarks = [
  { label: "Mary-Ann McLoughlin", style: styles.signature },
  { label: "NEXT PROPERTY GROUP", style: styles.condensed },
  { label: "Kael Sharp", style: styles.signature },
  { label: "RAY WHITE CASTLE HILL", style: styles.wide },
  { label: "Shana Feng", style: styles.signature },
];

function MarkSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className={styles.markSet} aria-hidden={duplicate || undefined}>
      {partnerMarks.map((mark) => (
        <span className={`${styles.mark} ${mark.style}`} key={mark.label}>
          {mark.label}
        </span>
      ))}
    </div>
  );
}

export function LogoCarousel() {
  return (
    <section className={styles.section} aria-label="Agents and agencies working with Arcanium Digital">
      <p className={styles.label}>Built alongside ambitious Australian agents</p>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <MarkSet />
          <MarkSet duplicate />
        </div>
      </div>
    </section>
  );
}

