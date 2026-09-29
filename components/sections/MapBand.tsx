import { AmsterdamMap } from "@/components/brand/AmsterdamMap";
import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./MapBand.module.css";

/**
 * Dark map band after the reference (REFERENCE 5.5): P4 on enter, abstract city-map background that
 * settles from scale 1.08, centred heading, subline and a white pill CTA with a pulsing dot.
 * No property pins, no prices (PRD §6): the only marker is the city itself.
 */
export function MapBand({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={`inverse ${styles.band}`} data-expand data-map-band aria-labelledby="map-title">
      <div className={styles.mapWrap}>
        <AmsterdamMap />
      </div>
      <div className={`container ${styles.content}`} data-fade-up>
        <MicroLabel className={styles.label}>{c.map.label}</MicroLabel>
        <h2 id="map-title" className="t-h2">
          {c.map.title}
        </h2>
        <p className={`t-lead ${styles.sub}`}>{c.map.sub}</p>
        <div className={styles.ctaRow}>
          <span className={styles.dotWrap} aria-hidden="true">
            <span className={styles.dotRing} data-pulse />
            <span className={styles.dot} />
          </span>
          <span className={`t-micro ${styles.dotLabel}`}>{c.map.dot}</span>
          <Button href={pathFor("about", lang)} variant="secondary" arrow>
            {c.map.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
