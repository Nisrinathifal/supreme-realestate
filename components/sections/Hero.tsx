import { heroFilm, heroNightFilm, heroStill } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { HeroFilm } from "./HeroFilm";
import { HeroBoat } from "./HeroBoat";
import { HeroNightFilm } from "./HeroNightFilm";
import { HeroScroll } from "@/components/windows/HeroScroll";
import { ProjectWindows } from "@/components/windows/ProjectWindows";
import styles from "./Hero.module.css";

/**
 * Hero (concept 2026-09-30): one full-bleed frame with the still underneath and the film over it (plays once
 * after the intro; concept 3 loops the canal film). Concept 3: the key message sits in the sky, in ink; the
 * headline is one line on the waterline, behind the passing boat (HeroBoat redraws the boat over it and lets the
 * first crossing bring the letters in). Scrolling brings dusk (HeroScroll): the night film (HeroNightFilm) comes up
 * over the day film and, once it is dark, rests on its last frame and the spotlight settles on the four project windows (components/windows); click one to enter
 * its project through that window.
 * Complete without JavaScript (the still); with it the film starts by itself and marks the hero live (HeroFilm),
 * and the header arrives once the headline does. No intro, no key message under the lockup (owner, 2026-10-05).
 */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const hasFilm = Boolean(heroFilm.mp4 || heroFilm.webm);
  return (
    <section id="home" className={styles.hero} data-hero data-tone="dark" data-header-veil="off" aria-labelledby="hero-title">
      <div className={styles.frame} data-hero-frame>
        <MediaFrame image={heroStill} ratio="fill" lang={lang} radius="none" priority className={styles.still} />
        {hasFilm ? <HeroFilm film={heroFilm} labels={{ pause: c.hero.pause, play: c.hero.play }} /> : null}
        <HeroNightFilm film={heroNightFilm} />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={styles.copy} data-hero-copy>
        <h1 id="hero-title" className={styles.title} data-hero-title>
          {c.hero.headline.replace(/\s*\n\s*/g, " ")}
        </h1>
      </div>
      {hasFilm && heroFilm.subject ? <HeroBoat subject={heroFilm.subject} /> : null}
      <ProjectWindows lang={lang} />
      <HeroScroll />
    </section>
  );
}
