import styles from "./logo-carousel.module.css";
const marks=[["MARY-ANN","McLOUGHLIN"],["NEXT","PROPERTY GROUP"],["KAEL","SHARP"],["RAY WHITE","CASTLE HILL"],["SHANA","FENG"]];
function Marks({hidden=false}:{hidden?:boolean}){return <div className={styles.set} aria-hidden={hidden}>{marks.map(([a,b])=><span key={a+b}><strong>{a}</strong><small>{b}</small></span>)}</div>}
export function LogoCarousel(){return <section className={styles.section} aria-label="Agents and agencies working with Arcanium Digital"><p>Built alongside ambitious Australian agents</p><div className={styles.viewport}><div className={styles.track}><Marks/><Marks hidden/></div></div></section>}
