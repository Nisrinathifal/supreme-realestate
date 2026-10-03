import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { workBoards } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { WorkMotion } from "./WorkMotion";
import styles from "./Work.module.css";

/**
 * Collaboration (owner brief 2026-10-03, after the reference's deck): five boards, one per collaborator, held as one
 * physical stack over the headline. With motion (WorkMotion) the section is a tall scroll with a sticky stage: the
 * top board lifts away first, then the next, each revealing the one beneath, until the five settle around the
 * headline. Without motion (reduced motion, no JS) the headline and the boards read as a plain list. Each board is a
 * presentation board: index, label and title beside the picture.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="collaboration" className={styles.work} data-work aria-labelledby="work-title">
      <WorkMotion>
        <div className={styles.stage} data-work-stage>
          <div className={`container ${styles.content}`} data-work-content>
            <MicroLabel className={styles.label}>{c.work.label}</MicroLabel>
            <h2 id="work-title" className={styles.title}>
              {c.work.title}
            </h2>
          </div>
          <ol className={styles.stack} data-work-stack>
            {c.work.cards.map((card, i) => {
              const image = workBoards[i];
              return (
                <li key={card.index} className={styles.card} data-work-card style={{ zIndex: c.work.cards.length - i }}>
                  <article className={styles.board} aria-labelledby={`work-card-${card.index}`}>
                    <div className={styles.copy}>
                      <MicroLabel className={styles.index}>{card.index}</MicroLabel>
                      <div className={styles.copyFoot}>
                        <MicroLabel className={styles.cardLabel}>{card.label}</MicroLabel>
                        <h3 id={`work-card-${card.index}`} className={styles.cardTitle}>
                          {card.title}
                        </h3>
                      </div>
                    </div>
                    <div className={styles.picture}>
                      {image ? <MediaFrame image={image} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 100vw, 50vw" className={styles.frame} /> : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </WorkMotion>
    </section>
  );
}
