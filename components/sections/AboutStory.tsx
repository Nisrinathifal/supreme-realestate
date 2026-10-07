import { getCopy } from "@/content/copy";
import { projects } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { AboutStoryMotion } from "./AboutStoryMotion";
import styles from "./AboutStory.module.css";

/**
 * About (owner, 2026-10-07), under the collaboration ring. "From old to valuable", told literally: the company story
 * in five chapters beside one photograph of a featured project's kitchen that renews from the works to the finished
 * room as the chapters are read (AboutStoryMotion). The company details follow in their own band (CompanyLetter).
 * Reduced motion and no-JS: the finished room and every chapter in full.
 */
export function AboutStory({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const s = c.aboutStory;
  const pair = projects.find((p) => p.compare.length > 0)?.compare[0];

  return (
    <section id="about" className={styles.about} data-about-story aria-labelledby="about-title">
      <AboutStoryMotion>
        <div className={`container ${styles.inner}`}>
          <header className={styles.head}>
            <MicroLabel className={styles.label}>{s.label}</MicroLabel>
            <h2 id="about-title" className={styles.title}>
              {s.title.split(" ").map((word, i) => (
                <span key={i} className={styles.mask}>
                  <span data-story-word>{word}</span>
                </span>
              ))}
            </h2>
          </header>

          <div className={styles.story}>
            <div className={styles.aside}>
              <div className={styles.sticky}>
                {pair ? (
                  <figure className={styles.frame} data-story-frame>
                    <div className={styles.layer}>
                      <MediaFrame image={pair.before} ratio="fill" lang={lang} radius="none" sizes="(max-width: 980px) 100vw, 42vw" />
                    </div>
                    <div className={`${styles.layer} ${styles.after}`}>
                      <MediaFrame image={pair.after} ratio="fill" lang={lang} radius="none" sizes="(max-width: 980px) 100vw, 42vw" />
                    </div>
                    <span className={styles.seam} aria-hidden="true" />
                    <figcaption className={styles.tags} aria-hidden="true">
                      <span className={styles.tagBefore}>{s.frame.before}</span>
                      <span className={styles.tagAfter}>{s.frame.after}</span>
                    </figcaption>
                  </figure>
                ) : null}
                <ol className={styles.rail} aria-hidden="true">
                  {s.chapters.map((ch, i) => (
                    <li key={i} className={styles.stop} data-story-stop={i}>
                      {ch.name}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={styles.chapters}>
              {s.chapters.map((ch, i) => (
                <article key={i} className={styles.chapter} data-story-chapter={i}>
                  <h3 className={styles.chapterName}>{ch.name}</h3>
                  <p className={styles.chapterBody}>{ch.body}</p>
                </article>
              ))}
              <p className={styles.close}>{s.close}</p>
            </div>
          </div>

        </div>
      </AboutStoryMotion>
    </section>
  );
}
