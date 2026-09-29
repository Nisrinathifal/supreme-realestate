import { RoofFrame } from "@/components/brand/RoofFrame";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { impressions } from "@/content/media";
import type { Lang } from "@/content/routes";
import styles from "./Impressies.module.css";

/**
 * Impressies (DESIGN §10.1 §5): no heading, no label. One 21:9 image (roof frame, the one per view),
 * then two images in a 7/5 split. Atmosphere, never a property.
 */
export function Impressies({ lang }: { lang: Lang }) {
  return (
    <section className={`section ${styles.section}`} aria-hidden="true">
      <div className={`container ${styles.inner}`}>
        <RoofFrame className={styles.wide}>
          <div data-mask data-parallax>
            <MediaFrame image={impressions.wide.image} ratio="21/9" lang={lang} radius="none" decorative sizes="100vw" />
          </div>
        </RoofFrame>
        <div className={styles.split}>
          <div className={styles.left} data-mask data-parallax>
            <MediaFrame image={impressions.left.image} ratio="4/5" lang={lang} decorative sizes="(max-width: 980px) 100vw, 58vw" />
          </div>
          <div className={styles.right} data-mask data-parallax>
            <MediaFrame image={impressions.right.image} ratio="16/9" lang={lang} decorative sizes="(max-width: 980px) 100vw, 42vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
