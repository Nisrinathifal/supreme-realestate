import { getCopy } from "@/content/copy";
import { beforeImages, caseImages, skyImage, stepsSketches } from "@/content/media";
import type { Lang } from "@/content/routes";
import { AlphaImage } from "@/components/ui/AlphaImage";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { AboutStoryMotion } from "./AboutStoryMotion";
import styles from "./AboutStory.module.css";

/**
 * About (owner, 2026-10-07, after the "design at the speed of thought" run of illoca.unseen.co): one continuous camera
 * through the company's story. The promise as a large title over a wide frame; the frame opens to the full view and
 * then docks right and left by turns, a chapter beside it each time, while its scene changes without a cut: the city's
 * gables (why), a floor stripped back (what we do), the drawing on a dark ground (design), the kitchen during the works
 * (realisation) and the same kitchen finished (delivery). At the end the frame fills the view and darkens into the
 * letter band below (CompanyLetter), so the two read as one. AboutStoryMotion runs it on wide screens with motion on;
 * phones, reduced motion and no-JS read the title, the finished kitchen and the chapters in order.
 */
export function AboutStory({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const s = c.aboutStory;
  const sketch = stepsSketches.left.image;
  const block = stepsSketches.right.image;
  const scenes = [
    { key: "city", image: skyImage },
    { key: "stripped", image: beforeImages.b[1] },
    { key: "drawing", image: null },
    { key: "works", image: beforeImages.b[0] },
    { key: "finished", image: caseImages.b[1] },
  ];

  return (
    <section id="about" className={styles.about} data-about-film aria-labelledby="about-title">
      <AboutStoryMotion>
        <div className={styles.stage} data-film-stage>
          <header className={styles.head} data-film-head>
            <MicroLabel className={styles.label}>{s.label}</MicroLabel>
            <h2 id="about-title" className={styles.title}>
              {s.title.split(" ").map((word, i) => (
                <span key={i} className={styles.mask}>
                  <span data-film-word>{word}</span>
                </span>
              ))}
            </h2>
          </header>

          <div className={styles.frame} data-film-frame aria-hidden="true">
            <div className={styles.camera} data-film-camera>
              {scenes.map((sc) => (
                <div key={sc.key} className={sc.image ? styles.scene : `${styles.scene} ${styles.drawing}`} data-film-scene={sc.key}>
                  {sc.image ? (
                    <MediaFrame image={sc.image} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative />
                  ) : (
                    <div className={styles.sketches}>
                      {sketch ? <AlphaImage image={sketch} lang={lang} size={520} className={styles.sketch} decorative /> : null}
                      {block ? <AlphaImage image={block} lang={lang} size={520} className={styles.sketch} decorative /> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className={styles.dusk} data-film-dusk />
          </div>

          <ol className={styles.chapters}>
            {s.chapters.map((ch, i) => (
              <li key={i} className={i % 2 === 0 ? `${styles.chapter} ${styles.left}` : `${styles.chapter} ${styles.right}`} data-film-chapter={i}>
                <span className={`t-micro ${styles.index}`} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.chapterName}>{ch.name}</h3>
                <p className={styles.chapterBody}>{ch.body}</p>
                {i === s.chapters.length - 1 ? <p className={styles.close}>{s.close}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </AboutStoryMotion>
    </section>
  );
}
