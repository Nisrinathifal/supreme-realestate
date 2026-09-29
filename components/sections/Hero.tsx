import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { heroFilm, heroSubject } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { HeroFilm } from "./HeroFilm";
import styles from "./Hero.module.css";

/**
 * Hero after the reference (REFERENCE 5.1): rounded framed panel, landscape film/poster, an optional
 * cut-out subject layer, headline top-left, short lead, one dark CTA. No chips, no listing card.
 */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={styles.hero} data-hero data-hero-film aria-labelledby="hero-title">
      <div className={styles.panel} data-hero-media>
        <div className={styles.bg} data-hero-bg>
          <HeroFilm film={heroFilm} lang={lang} labels={{ pause: c.hero.pause, play: c.hero.play }} />
        </div>
        {heroSubject.image ? (
          <div className={styles.subject} data-hero-subject>
            <MediaFrame image={heroSubject.image} ratio="4/5" lang={lang} radius="none" decorative priority sizes="(max-width: 980px) 70vw, 40vw" />
          </div>
        ) : null}
        <div className={styles.scrim} aria-hidden="true" />
        <div className={`${styles.content}`}>
          <div className={styles.copy} data-hero-copy>
            <h1 id="hero-title" className={`t-display ${styles.title}`}>
              {c.hero.display}
            </h1>
            <p className={`t-lead ${styles.lead}`}>{c.hero.lead}</p>
            <div className={styles.actions}>
              <Button href={pathFor("contact", lang)} variant="primary">
                {c.hero.primary}
              </Button>
            </div>
          </div>
        </div>
        <MicroLabel className={styles.coords}>{c.hero.coordinates}</MicroLabel>
      </div>
    </section>
  );
}
