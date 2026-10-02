import Link from "next/link";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, workCount, workPathFor, type Lang } from "@/content/routes";
import styles from "./WorkCasePage.module.css";

/**
 * Work case detail (concept 2026-10-02): the cover full-bleed under the bar with the index and the title, one line
 * and three notes along the three steps, the photographs in a two-column grid, then the way back and the next case.
 * Anonymous by design (PRD §6): no name, address, year or figures; copy is draft until the owner replaces it.
 */
export function WorkCasePage({ lang, index }: { lang: Lang; index: number }) {
  const c = getCopy(lang);
  const item = c.work.items[index];
  const media = workCases[index];
  const total = String(c.work.items.length).padStart(2, "0");
  const nextIndex = (index + 1) % workCount;
  const next = c.work.items[nextIndex];
  const nextMedia = workCases[nextIndex];
  const photos = [...media.details, ...media.gallery];
  const home = pathFor("home", lang);

  return (
    <article className={styles.page}>
      <header className={styles.hero} data-header-theme="dark">
        <div className={styles.heroMedia}>
          <MediaFrame image={media.cover} ratio="fill" lang={lang} radius="none" priority sizes="100vw" />
        </div>
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={`container ${styles.heroCopy}`}>
          <MicroLabel className={styles.heroLabel}>
            {item.index} {c.work.of} {total}
          </MicroLabel>
          <h1 className={styles.title}>{item.title}</h1>
        </div>
      </header>

      <section className={`section ${styles.intro}`} aria-label={item.title}>
        <div className={`container ${styles.introInner}`}>
          <p className={`t-lead ${styles.lead}`}>{item.body}</p>
          <ol className={styles.notes}>
            {item.notes.map((n, i) => (
              <li key={n.title} className={styles.note}>
                <MicroLabel>{String(i + 1).padStart(2, "0")}</MicroLabel>
                <h2 className={styles.noteTitle}>{n.title}</h2>
                <p className={styles.noteBody}>{n.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.gallery} aria-label={c.work.label}>
        <ul className={`container ${styles.grid}`}>
          {photos.map((p) => (
            <li key={p.src} className={p.height > p.width ? styles.tall : styles.wide}>
              <MediaFrame image={p} ratio={p.height > p.width ? "4/5" : "16/9"} lang={lang} radius="lg" sizes="(max-width: 767px) 100vw, 50vw" />
            </li>
          ))}
        </ul>
      </section>

      <nav className={`container ${styles.nav}`} aria-label={c.work.next}>
        <Link href={`${home === "/" ? "" : home}/#work`} className={`t-micro ${styles.back}`}>
          {c.work.back}
        </Link>
        <Link href={workPathFor(nextIndex, lang)} className={styles.nextCard}>
          <span className={styles.nextThumb}>
            <MediaFrame image={nextMedia.cover} ratio="16/9" lang={lang} radius="lg" decorative sizes="240px" />
          </span>
          <span className={styles.nextCopy}>
            <span className="t-micro">{c.work.next}</span>
            <span className={styles.nextTitle}>{next.title}</span>
          </span>
        </Link>
      </nav>
    </article>
  );
}
