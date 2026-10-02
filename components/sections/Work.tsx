import type { CSSProperties } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { WorkMotion } from "./WorkMotion";
import styles from "./Work.module.css";

/** Card surfaces, alternating dark and light: Canal ink, Sky mist, the inverse surface, Lime mist (DESIGN §3). */
const tones = [`inverse ${styles.toneInk}`, styles.toneSky, `inverse ${styles.toneMoss}`, styles.toneLime];

/**
 * Projects (concept 2026-10-02, after the reference's "what we ship" deck): a two-line heading, then four cases as
 * coloured cards. Each card: title, index, body, a note on what the photographs show, three photographs and one link
 * covering the whole card, whose pill follows the pointer anywhere on the card. The band follows the intro in the flow; its heading and first card settle as
 * they come into view, scrubbed; on desktop the deck is then pinned and each next card rises over the current one
 * while the ones still to come wait as strips below (WorkMotion). Phones stack the cards with CSS sticky; reduced
 * motion and no-JS read the cards one after another. Cases are anonymous (PRD §6): interiors, no names or addresses.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const n = c.work.items.length;
  return (
    <section className={`section ${styles.work}`} data-work aria-labelledby="work-title">
      <div className="container">
        <h2 id="work-title" className={styles.heading} data-work-heading>
          <span className={styles.headingMuted}>{c.work.label}</span>
          <span className={styles.headingInk}>{c.work.title}</span>
        </h2>
      </div>
      <WorkMotion>
        <ol className={styles.deck} data-work-deck>
          {c.work.items.map((item, i) => {
            const media = workCases[i];
            if (!media) return null;
            const style = { "--i": i, "--behind": n - 1 - i } as CSSProperties;
            return (
              <li key={item.index} className={`${styles.card} ${tones[i % tones.length]}`} style={style} data-work-card>
                <article className={styles.inner} aria-labelledby={`work-${media.id}-title`}>
                  <header className={styles.head}>
                    <h3 id={`work-${media.id}-title`} className={styles.title}>
                      {item.title}
                    </h3>
                    <span className={styles.index} aria-hidden="true">
                      ({item.index})
                    </span>
                  </header>
                  <p className={styles.body}>{item.body}</p>
                  <div className={styles.foot}>
                    <p className={styles.note} data-work-note>
                      {item.note}
                    </p>
                    <div className={styles.gallery} data-work-gallery>
                      <ul className={styles.photos} data-work-photos>
                        {media.photos.map((p) => (
                          <li key={p.src} className={styles.photo}>
                            <MediaFrame image={p} ratio="16/9" lang={lang} radius="lg" sizes="(max-width: 767px) 46vw, 240px" />
                          </li>
                        ))}
                      </ul>
                      <span className={styles.pill} data-work-pill aria-hidden="true">
                        {c.work.cta}
                        <ArrowRight size={16} weight="light" />
                      </span>
                    </div>
                  </div>
                  <a href={pathFor("contact", lang)} className={styles.cover} aria-label={`${item.title}: ${c.work.cta}`} />
                </article>
              </li>
            );
          })}
        </ol>
      </WorkMotion>
    </section>
  );
}
