import { introSequence, skyImage } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { SkyMotion } from "./SkyMotion";
import styles from "./Sky.module.css";

/** Seven interior details for the fan of cards under the copy. */
const cards = introSequence.slice(0, 7);

/**
 * Sky band (concept 2026-10-01): the sky photograph full-bleed, brand promise, lead and the two buttons
 * (DESIGN §10.1), then a fan of small cards in perspective. Slides up over the held steps strip on desktop
 * (`data-overlap`, handled by StepsMotion); its own copy and cards rise in once on first view (SkyMotion).
 */
export function Sky({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="value" className={styles.sky} data-sky data-overlap aria-labelledby="sky-title">
      <MediaFrame image={skyImage} ratio="fill" lang={lang} radius="none" decorative className={styles.bg} sizes="100vw" />
      <SkyMotion>
        <div className={`container ${styles.inner}`}>
          <div className={styles.copy} data-sky-copy>
            <h2 id="sky-title" className={styles.title}>
              {c.sky.title}
            </h2>
            <p className={styles.lead}>{c.sky.lead}</p>
            <div className={styles.actions}>
              <Button href={pathFor("contact", lang)} variant="primary" arrow>
                {c.sky.primary}
              </Button>
              <Button href={pathFor("about", lang)} variant="glass">
                {c.sky.secondary}
              </Button>
            </div>
          </div>

          <ul className={styles.fan} data-sky-fan aria-hidden="true">
            {cards.map((img, i) => (
              <li key={img.src} className={styles.card} data-sky-card style={{ ["--i" as string]: i - (cards.length - 1) / 2 }}>
                <MediaFrame image={img} ratio="4/5" lang={lang} radius="lg" decorative sizes="200px" />
              </li>
            ))}
          </ul>
        </div>
      </SkyMotion>
    </section>
  );
}
