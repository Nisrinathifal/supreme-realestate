import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { workPathFor, type Lang } from "@/content/routes";
import { WorkSlider } from "./WorkSlider";
import styles from "./Work.module.css";

/**
 * Work section (2026-10-02, after the reference's project rows): an intro, then one plain row per case on Paper,
 * a hairline between them. Left: the index, the title, three facts (home, work, delivery: no city, area, days or
 * year, PRD §6) and the link to the case; right: a sideways row of photographs with a progress line and arrows.
 * Cases are anonymous; copy is draft until the owner replaces it.
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

      <ol className={styles.rows}>
        {c.work.items.map((item, i) => {
          const media = workCases[i];
          if (!media) return null;
          const slides = [media.details[0], media.gallery[0], media.details[1], media.gallery[1]].filter(Boolean);
          const href = workPathFor(i, lang);
          return (
            <li key={item.index} className={styles.row} data-work-row>
              <article className={`container ${styles.rowInner}`} aria-labelledby={`work-${media.id}-title`}>
                <div className={styles.info}>
                  <p className={`t-micro ${styles.index}`}>
                    {item.index} {c.work.of} {total}
                  </p>
                  <h3 id={`work-${media.id}-title`} className={styles.caseTitle}>
                    <Link href={href} className={styles.titleLink}>
                      {item.title}
                    </Link>
                  </h3>
                  <dl className={styles.facts}>
                    {(["home", "scope", "delivery"] as const).map((k) => (
                      <div key={k} className={styles.fact}>
                        <dt className="t-micro">{c.work.facts[k]}</dt>
                        <dd className={styles.factValue}>{item.facts[k]}</dd>
                      </div>
                    ))}
                  </dl>
                  <Button href={href} variant="secondary" className={styles.open}>
                    {c.work.open}
                  </Button>
                </div>
                <WorkSlider images={slides} lang={lang} labels={c.work.slider} />
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
