import { Fragment } from "react";
import { caseImages } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { AboutMotion } from "./AboutMotion";
import styles from "./About.module.css";

/**
 * About band (owner, 2026-10-07; copy from the section-drafts doc): on the shelf's Paper, between the shelf and the
 * dark steps band. Four levels, one step each: a label, the brand promise as the title, a lead in ink and a quiet body,
 * beside one interior of a featured project; then the three principles in a row. Its foot darkens into the steps band
 * (AboutMotion, motion on). Without JS / reduced motion everything simply stands, in reading order.
 */
export function About({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const a = c.homeAbout;
  const photo = caseImages.b[0]; // tall stained-glass windows: a portrait crop that keeps the light
  return (
    <section id="about" className={styles.about} data-about aria-labelledby="about-title">
      <AboutMotion>
        <div className={`container ${styles.inner}`}>
          <div className={styles.grid}>
            <div className={styles.text}>
              <MicroLabel className={styles.label}>{a.label}</MicroLabel>
              <h2 id="about-title" className={styles.title}>
                {a.title.split(" ").map((word, i, all) => (
                  <Fragment key={i}>
                    <span className={styles.word}>
                      <span data-about-word>{word}</span>
                    </span>
                    {i < all.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </h2>
              <p className={styles.lead} data-about-rise>
                {a.lead}
              </p>
              <p className={styles.body} data-about-rise>
                {a.body}
              </p>
            </div>
            <div className={styles.media} data-about-media>
              <MediaFrame image={photo} ratio="4/5" lang={lang} radius="none" sizes="(max-width: 980px) 100vw, 40vw" />
            </div>
          </div>

          <div className={styles.principles}>
            <MicroLabel className={styles.label}>{a.principlesLabel}</MicroLabel>
            <ol className={styles.list}>
              {c.principles.items.map((p) => (
                <li key={p.index} className={styles.principle} data-about-principle>
                  <span className={`t-micro ${styles.index}`} aria-hidden="true">
                    {p.index}
                  </span>
                  <h3 className={styles.principleTitle}>{p.title}</h3>
                  <p className={styles.principleBody}>{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </AboutMotion>
    </section>
  );
}
