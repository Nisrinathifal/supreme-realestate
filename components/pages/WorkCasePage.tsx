import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, workCount, workPathFor, type Lang } from "@/content/routes";
import { WorkCaseMotion } from "./WorkCaseMotion";
import styles from "./WorkCasePage.module.css";

/**
 * Work case detail (2026-10-02, after the reference's project page): the way back, the title with the index, four
 * facts, three labelled paragraphs along the steps and the link to the next case; the cover; then chapters, each a
 * keyword, a large statement that reveals as it scrolls and two photographs; finally the other cases. Anonymous
 * by design (PRD §6): no name, address, area, days or year; copy is draft until the owner replaces it.
 */
export function WorkCasePage({ lang, index }: { lang: Lang; index: number }) {
  const c = getCopy(lang);
  const item = c.work.items[index];
  const media = workCases[index];
  const total = String(c.work.items.length).padStart(2, "0");
  const nextIndex = (index + 1) % workCount;
  const home = pathFor("home", lang);
  const overview = `${home === "/" ? "" : home}/#work`;
  const photos = [media.details[0], media.gallery[0], media.gallery[1], media.gallery[2], media.details[1], media.gallery[3]];
  const others = c.work.items.map((it, i) => ({ it, i })).filter(({ i }) => i !== index);

  return (
    <article className={styles.page}>
      <WorkCaseMotion>
        <header className={`container ${styles.head}`}>
          <Link href={overview} className={`t-micro ${styles.back}`}>
            <span aria-hidden="true">← </span>
            {c.work.back}
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={styles.index}>
              <span className="t-micro">{c.work.label}</span>
              <span className={styles.indexNumber}>
                {item.index}
                <span className={styles.indexOf}>/{total}</span>
              </span>
            </p>
          </div>
          <dl className={styles.facts}>
            {(["home", "scope", "delivery", "status"] as const).map((k) => (
              <div key={k} className={styles.fact}>
                <dt className="t-micro">{c.work.facts[k]}</dt>
                <dd className={styles.factValue}>{item.facts[k]}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.notes}>
            {item.notes.map((n) => (
              <div key={n.title} className={styles.note}>
                <p className={`t-micro ${styles.noteKey}`}>{n.title}</p>
                <p className={styles.noteBody}>{n.body}</p>
              </div>
            ))}
          </div>
          <Button href={workPathFor(nextIndex, lang)} variant="outline" className={styles.nextButton}>
            {c.work.next}
          </Button>
        </header>

        <div className={`container ${styles.cover}`}>
          <MediaFrame image={media.cover} ratio="16/9" lang={lang} radius="lg" priority sizes="(max-width: 980px) 100vw, 1200px" />
        </div>

        <div className={styles.chapters}>
          {item.chapters.map((ch, i) => {
            const pair = [photos[i * 2], photos[i * 2 + 1]].filter(Boolean);
            return (
              <section key={ch.key} className={`container ${styles.chapter}`} aria-label={ch.key}>
                <p className={`t-micro ${styles.chapterKey}`}>{ch.key}:</p>
                <p className={styles.statement} data-work-statement>
                  {ch.statement.split(" ").map((w, j) => (
                    <span key={j} className={styles.word}>
                      {w}{" "}
                    </span>
                  ))}
                </p>
                <ul className={`${styles.photos} ${i % 2 ? styles.photosAlt : ""}`}>
                  {pair.map((p) => (
                    <li key={p.src} className={p.height > p.width ? styles.tall : styles.wide}>
                      <MediaFrame image={p} ratio={p.height > p.width ? "4/5" : "16/9"} lang={lang} radius="lg" sizes="(max-width: 767px) 100vw, 60vw" />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <nav className={`container ${styles.more}`} aria-label={c.work.more}>
          <div className={styles.moreHead}>
            <p className="t-micro">{c.work.continueLabel}</p>
            <h2 className={styles.moreTitle}>{c.work.more}</h2>
          </div>
          <ul className={styles.moreList}>
            {others.map(({ it, i }) => (
              <li key={it.index} className={styles.moreItem}>
                <Link href={workPathFor(i, lang)} className={styles.moreLink}>
                  <span className={styles.moreThumb}>
                    <MediaFrame image={workCases[i].cover} ratio="16/9" lang={lang} radius="lg" decorative sizes="200px" />
                  </span>
                  <span className={styles.moreCopy}>
                    <span className={`t-micro ${styles.moreIndex}`}>
                      {it.index} {c.work.of} {total}
                    </span>
                    <span className={styles.moreName}>{it.title}</span>
                  </span>
                  <span className={`t-micro ${styles.moreOpen}`} aria-hidden="true">
                    {c.work.open}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </WorkCaseMotion>
    </article>
  );
}
