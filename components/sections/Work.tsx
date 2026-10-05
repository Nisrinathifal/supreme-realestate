import type { CSSProperties } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { workCases } from "@/content/media";
import { projects } from "@/content/projects";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { WorkEnter } from "./WorkEnter";
import { WorkMotion } from "./WorkMotion";
import styles from "./Work.module.css";

/** Card surfaces, alternating dark and light: Canal ink, Sky mist, the inverse surface, Lime mist (DESIGN §3). */
const tones = [`inverse ${styles.toneInk}`, `light ${styles.toneSky}`, `inverse ${styles.toneMoss}`, `light ${styles.toneLime}`];

/**
 * Projects (concept 2026-10-02, after the reference's "what we ship" deck): a label and a heading, then four cases as
 * coloured cards. Each card: title, index, body, a note on what the photographs show, three photographs and one link
 * covering the whole card, whose pill follows the pointer anywhere on the card. Since 2026-10-05 the band follows
 * the hero directly and each card is one of the four named projects (content/projects.ts): its name and city
 * above the case title, and the cover enters that project's overlay (WorkEnter), like a window in the film. Its
 * A Canal-ink band with no heading, continuing the night hero, that fades to the next band's wall as the page moves
 * on (WorkMotion), so the two never meet at an edge: on desktop the film's four window boxes travel
 * down with the scroll and turn into the cards (WorkMotion's handoff); on phones the deck rises in. The deck is then pinned and each next card rises over the current one while the
 * ones still to come wait as strips below (WorkMotion), on phones too.
 * Reduced motion and no-JS read the cards one after another.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const n = c.work.items.length;
  return (
    <section className={`section inverse ${styles.work}`} data-work aria-labelledby="work-title">
      {/* No heading in sight (owner, 2026-10-05): the band continues the night hero; the name stays for assistive tech */}
      <h2 id="work-title" className="visually-hidden">
        {c.work.title}
      </h2>
      <WorkMotion>
        <ol className={styles.deck} data-work-deck style={{ "--count": n } as CSSProperties}>
          {c.work.items.map((item, i) => {
            const media = workCases[i];
            const project = projects[i];
            if (!media || !project) return null;
            const style = { "--i": i, "--behind": n - 1 - i } as CSSProperties;
            return (
              <li key={item.index} className={`${styles.card} ${tones[i % tones.length]}`} style={style} data-work-card data-project={project.id}>
                <article className={styles.inner} aria-labelledby={`work-${media.id}-title`}>
                  <header className={styles.head}>
                    <div>
                      <p className={`t-micro ${styles.project}`}>
                        {project.name} · {project.location}
                      </p>
                      <h3 id={`work-${media.id}-title`} className={styles.title}>
                        {item.title}
                      </h3>
                    </div>
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
                            <MediaFrame image={p} ratio="16/9" lang={lang} radius="none" sizes="(max-width: 767px) 46vw, 200px" />
                          </li>
                        ))}
                      </ul>
                      <span className={styles.pill} data-work-pill aria-hidden="true">
                        {c.projects.explore}
                        <ArrowRight size={16} weight="light" />
                      </span>
                    </div>
                  </div>
                  <WorkEnter id={project.id} label={c.projects.hotspot(project.name)} className={styles.cover} />
                </article>
              </li>
            );
          })}
        </ol>
      </WorkMotion>
    </section>
  );
}
