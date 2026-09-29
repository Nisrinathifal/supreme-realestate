import { heroFilm } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { HeroStory } from "./HeroStory";
import styles from "./Hero.module.css";

/** Hero: full-bleed film with the synced word sequence and the key message (H1) over its sky. */
export function Hero({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={styles.hero} data-hero data-hero-film aria-labelledby="hero-title">
      <HeroStory film={heroFilm} lang={lang} sequence={c.hero.sequence} headline={c.hero.headline} keyMessage={c.hero.keyMessage} labels={{ pause: c.hero.pause, play: c.hero.play }} />
    </section>
  );
}
