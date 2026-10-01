import { introSequence, skyImage } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { SkyMotion } from "./SkyMotion";
import styles from "./Sky.module.css";

/** Card images: interior details from the intro set until dedicated photos arrive. */
const cardImages = introSequence.slice(0, 7);

/**
 * Sky band (concept 2026-10-01): the sky photograph full-bleed, label, headline, lead and one button, then a
 * fan of seven captioned cards (image, title, one line) in perspective. Slides up over the held steps strip
 * on desktop (`data-overlap`, handled by StepsMotion); copy and cards rise in once on first view (SkyMotion).
 */
export function Sky({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="value" className={styles.sky} data-sky data-overlap aria-labelledby="sky-title">
      <MediaFrame image={skyImage} ratio="fill" lang={lang} radius="none" decorative className={styles.bg} sizes="100vw" />
      <SkyMotion>
        <div className={`container ${styles.inner}`}>
          <div className={styles.copy} data-sky-copy>
            <MicroLabel>{c.sky.label}</MicroLabel>
            <h2 id="sky-title" className={styles.title}>
              {c.sky.title}
            </h2>
            <p className={styles.lead}>{c.sky.lead}</p>
            <div className={styles.actions}>
              {/* PRD §6.3: there is no projects page; until that decision the button leads to the About page */}
              <Button href={pathFor("about", lang)} variant="primary" arrow>
                {c.sky.cta}
              </Button>
            </div>
          </div>

          <ul className={styles.fan} data-sky-fan>
            {c.sky.cards.map((card, i) => (
              <li key={card.title} className={`light ${styles.card}`} data-sky-card style={{ ["--i" as string]: i - (c.sky.cards.length - 1) / 2 }}>
                <MediaFrame image={cardImages[i] ?? null} ratio="4/5" lang={lang} radius="none" decorative sizes="220px" className={styles.cardImage} />
                <div className={styles.cardText}>
                  <MicroLabel as="h3" className={styles.cardTitle}>
                    {card.title}
                  </MicroLabel>
                  <p className={styles.cardBody}>{card.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SkyMotion>
    </section>
  );
}
