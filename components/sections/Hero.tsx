import { HairlineGrid } from "@/components/brand/HairlineGrid";
import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { heroFilm } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { HeroFilm } from "./HeroFilm";
import styles from "./Hero.module.css";

/** Homepage hero (DESIGN §10.1 §1): film, scrim, hairline grid, coordinates, copy, two buttons. */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={styles.hero} data-hero data-hero-film aria-labelledby="hero-title">
      <div className={styles.media} data-hero-media>
        <HeroFilm film={heroFilm} lang={lang} labels={{ pause: c.hero.pause, play: c.hero.play }} />
        <div className={styles.scrimTop} aria-hidden="true" />
        <div className={styles.scrim} aria-hidden="true" />
        <HairlineGrid />
        <MicroLabel className={styles.coords}>{c.hero.coordinates}</MicroLabel>
      </div>
      <div className={`container ${styles.content}`}>
        <div className={styles.copy} data-hero-copy>
          <h1 id="hero-title" className="t-display">
            {c.hero.display}
          </h1>
          <p className="t-lead">{c.hero.lead}</p>
          <div className={styles.actions}>
            <Button href={pathFor("contact", lang)} variant="primary" arrow>
              {c.hero.primary}
            </Button>
            <Button href={pathFor("about", lang)} variant="glass">
              {c.hero.secondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
