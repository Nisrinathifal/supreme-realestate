import Link from "next/link";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { workPathFor, type Lang } from "@/content/routes";
import { WorkCompare } from "./WorkCompare";
import styles from "./Work.module.css";

/**
 * Work section (2026-10-02): an intro, then one full-bleed card per case that sticks and stacks: each card is a
 * title strip (index and the title, which links to the case) over a before/after comparison of the home. Cards
 * slide up over the previous one as the page scrolls, leaving the earlier strips showing (after the reference
 * recording); the stacking is CSS, the wipe-in lives in WorkCompare. Cases are anonymous (PRD §6); copy is draft.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const total = String(c.work.items.length).padStart(2, "0");
  return (
    <section id="work" className={styles.work} data-work aria-labelledby="work-title">
      <div className={`container ${styles.intro}`}>
        <MicroLabel>{c.work.label}</MicroLabel>
        <h2 id="work-title" className={styles.title}>
          {c.work.title}
        </h2>
        <p className={styles.lead}>{c.work.lead}</p>
      </div>

      <ol className={styles.cards}>
        {c.work.items.map((item, i) => {
          const media = workCases[i];
          if (!media) return null;
          return (
            <li key={item.index} className={styles.card} style={{ "--i": i } as React.CSSProperties} data-work-card>
              <article className={styles.cardInner} aria-labelledby={`work-${media.id}-title`}>
                <header className={`container ${styles.strip}`}>
                  <p className={`t-micro ${styles.index}`}>
                    {item.index} {c.work.of} {total}
                  </p>
                  <h3 id={`work-${media.id}-title`} className={styles.caseTitle}>
                    <Link href={workPathFor(i, lang)} className={styles.titleLink}>
                      {item.title}
                      <span className={`t-micro ${styles.open}`} aria-hidden="true">
                        {c.work.open} →
                      </span>
                    </Link>
                  </h3>
                </header>
                <div className={styles.media}>
                  <WorkCompare before={media.before} after={media.cover} lang={lang} labels={c.work.compare} />
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
