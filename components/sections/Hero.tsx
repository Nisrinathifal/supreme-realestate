import { Fragment } from "react";
import { heroFilm, heroStill } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { HeroFilm } from "./HeroFilm";
import { HeroReveal } from "./HeroReveal";
import styles from "./Hero.module.css";

/**
 * Hero (concept 2026-09-30): one full-bleed frame with the still underneath and the film over it (plays once
 * after the intro; concept 3 loops the canal film), headline and key message centred in the sky, in ink. With a
 * film path (concept 3) the copy appears letter by letter as the boat passes under it (HeroReveal).
 * Complete without JavaScript (the still). On the first visit the intro (components/motion/Preloader) grows
 * `[data-hero-frame]` from a small square to the full viewport and fades `[data-hero-copy]` in; all of those
 * start states are set in JS, never here.
 */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const hasFilm = Boolean(heroFilm.mp4 || heroFilm.webm);
  return (
    <section id="home" className={styles.hero} data-hero data-header-veil="off" aria-labelledby="hero-title">
      <div className={styles.frame} data-hero-frame>
        <MediaFrame image={heroStill} ratio="fill" lang={lang} radius="none" priority className={styles.still} />
        {hasFilm ? <HeroFilm film={heroFilm} labels={{ pause: c.hero.pause, play: c.hero.play }} /> : null}
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={styles.copy} data-hero-copy>
        <h1 id="hero-title" className={styles.title} data-hero-title>
          {/* One block per line; the space between them keeps the accessible name "Beyond Spaces…" */}
          {c.hero.headline.split("\n").map((line, i) => (
            <Fragment key={i}>
              {i > 0 ? " " : null}
              <span className={styles.line}>{line}</span>
            </Fragment>
          ))}
        </h1>
        <p className={styles.lead} data-hero-lead>
          {c.hero.keyMessage}
        </p>
      </div>
      {hasFilm && heroFilm.path ? <HeroReveal path={heroFilm.path} /> : null}
    </section>
  );
}
