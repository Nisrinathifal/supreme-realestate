import { heroFilm, heroStill } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { HeroFilm } from "./HeroFilm";
import styles from "./Hero.module.css";

/**
 * Hero (concept 2026-09-30): one full-bleed frame with the still underneath and the film over it (plays once
 * after the intro, holds the finished house), headline and key message centred at the bottom over the scrim.
 * Complete without JavaScript (the still). On the first visit the intro (components/motion/Preloader) grows
 * `[data-hero-frame]` from a small square to the full viewport and fades `[data-hero-copy]` in; all of those
 * start states are set in JS, never here.
 */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const hasFilm = Boolean(heroFilm.mp4 || heroFilm.webm);
  return (
    <section id="home" className={styles.hero} data-hero aria-labelledby="hero-title">
      <div className={styles.frame} data-hero-frame>
        <MediaFrame image={heroStill} ratio="fill" lang={lang} radius="none" priority className={styles.still} />
        {hasFilm ? <HeroFilm film={heroFilm} labels={{ pause: c.hero.pause, play: c.hero.play }} /> : null}
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={styles.copy} data-hero-copy>
        <h1 id="hero-title" className={styles.title}>
          {c.hero.headline}
        </h1>
        <p className={styles.lead}>{c.hero.keyMessage}</p>
      </div>
    </section>
  );
}
