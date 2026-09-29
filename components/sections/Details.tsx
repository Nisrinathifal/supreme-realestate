import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { detailSequence } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { SequenceCounter } from "./SequenceCounter";
import styles from "./Details.module.css";

/**
 * Materiaal, licht en ruimte (DESIGN §10.1 §4): image sequence (§9.6), asymmetric grid on desktop,
 * keyboard-scrollable snap-scroller with a counter on ≤980px. No captions.
 */
export function Details({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const id = "details-sequence";
  return (
    <section className="section" aria-labelledby="details-title">
      <div className="container">
        <div className={styles.head} data-rise>
          <MicroLabel data-rise-item>{c.details.label}</MicroLabel>
          <h2 id="details-title" className="t-h2" data-blur-in>
            {c.details.title}
          </h2>
        </div>
        <div className={styles.scrollerWrap}>
          <div id={id} className={styles.grid} tabIndex={0} role="region" aria-label={c.details.scrollerLabel} data-lenis-prevent>
            <ul className={styles.list}>
            {detailSequence.map((slot, i) => (
              <li key={slot.id} className={`${styles.item} ${styles[`i${i + 1}`]}`} data-parallax>
                <MediaFrame image={slot.image} ratio={slot.ratio} lang={lang} className={styles.frame} sizes="(max-width: 980px) 80vw, 40vw" />
              </li>
            ))}
            </ul>
          </div>
          <MicroLabel className={styles.counter}>
            <SequenceCounter scrollerId={id} total={detailSequence.length} />
          </MicroLabel>
        </div>
      </div>
    </section>
  );
}
