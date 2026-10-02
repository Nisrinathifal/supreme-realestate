import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { WorkMotion } from "./WorkMotion";
import styles from "./Work.module.css";

/**
 * Work section (concept 2026-10-02, after the reference's project slides): an intro, then four cases as full-height
 * cards that stick under the bar while the next one slides over them. Each card: a cover photograph with a scrim,
 * the index, a title and one line, and two detail photographs. Cases are anonymous (PRD §6): no names, addresses or
 * figures; interiors only. Motion (WorkMotion) adds a slow parallax on the covers and a rise-in of the copy; the
 * stacking itself is CSS, so phones, reduced motion and no-JS read the same.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const total = String(c.work.items.length).padStart(2, "0");
  return (
    <section id="work" className={`inverse ${styles.work}`} data-work data-header-theme="dark" aria-labelledby="work-title">
      <div className={`container ${styles.intro}`}>
        <MicroLabel>{c.work.label}</MicroLabel>
        <h2 id="work-title" className={styles.title}>
          {c.work.title}
        </h2>
        <p className={styles.lead}>{c.work.lead}</p>
      </div>

      <WorkMotion>
        <ol className={styles.cases} data-work-cases>
          {c.work.items.map((item, i) => {
            const media = workCases[i];
            if (!media) return null;
            return (
              <li key={item.index} className={styles.case} data-work-case>
                <article className={styles.card} aria-labelledby={`work-${media.id}-title`}>
                  <div className={styles.cover} data-work-cover>
                    <MediaFrame image={media.cover} ratio="fill" lang={lang} radius="none" sizes="100vw" className={styles.coverFrame} />
                  </div>
                  <div className={styles.scrim} aria-hidden="true" />
                  <div className={`container ${styles.content}`}>
                    <div className={styles.copy} data-work-copy>
                      <MicroLabel>
                        {item.index} {c.work.of} {total}
                      </MicroLabel>
                      <h3 id={`work-${media.id}-title`} className={styles.caseTitle}>
                        {item.title}
                      </h3>
                      <p className={styles.body}>{item.body}</p>
                    </div>
                    <ul className={styles.details} data-work-details>
                      {media.details.map((d) => (
                        <li key={d.src} className={styles.detail}>
                          <MediaFrame image={d} ratio="4/5" lang={lang} radius="lg" sizes="(max-width: 767px) 38vw, 200px" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </WorkMotion>
    </section>
  );
}
