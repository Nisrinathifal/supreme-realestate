import { introSequence, skyImage } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { SkyMotion } from "./SkyMotion";
import styles from "./Sky.module.css";

/** Card images: interior details from the intro set until the exterior/interior photography arrives. */
const cardImages = introSequence.slice(0, 7);

/** Perspective per position, far left to far right (owner's spec): width scale and tilt in degrees. */
const perspective = [
  { s: 0.7, r: -16 },
  { s: 0.82, r: -10 },
  { s: 0.92, r: -5 },
  { s: 1, r: 0 },
  { s: 0.92, r: 5 },
  { s: 0.82, r: 10 },
  { s: 0.7, r: 16 },
];

/**
 * Sky band (concept 2026-10-01, layout after the owner's reference): sky photograph full-bleed; label,
 * headline, lead and two buttons centred in the upper middle; below them a curved carousel of seven
 * presentation cards (same height, width scaled and tilted per position, centre card facing the viewer).
 * Slides up over the held steps strip on desktop (`data-overlap`, StepsMotion); copy and cards rise in once.
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
              <Button href="#approach" variant="primary" arrow>
                {c.sky.ctaPrimary}
              </Button>
              {/* PRD §6.3: no projects page exists; until that decision this leads to the About page */}
              <Button href={pathFor("about", lang)} variant="glass">
                {c.sky.ctaSecondary}
              </Button>
            </div>
          </div>

          <ul className={styles.carousel} data-sky-fan>
            {c.sky.cards.map((card, i) => {
              const p = perspective[i] ?? perspective[3];
              return (
                <li key={`${card.title}-${i}`} className={`light ${styles.card}`} data-sky-card style={{ ["--s" as string]: p.s, ["--r" as string]: p.r }}>
                  <div className={styles.cardImage}>
                    <MediaFrame image={cardImages[i] ?? null} ratio="fill" lang={lang} radius="none" decorative sizes="220px" />
                  </div>
                  <div className={styles.cardText}>
                    <MicroLabel as="h3" className={styles.cardTitle}>
                      {card.title}
                    </MicroLabel>
                    <p className={styles.cardBody}>{card.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </SkyMotion>
    </section>
  );
}
