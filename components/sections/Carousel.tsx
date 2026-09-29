import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { carouselImages } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./Carousel.module.css";

/**
 * Card-pair carousel after the reference (REFERENCE 5.4): centred heading + subline (P3), then pairs of a
 * text card and a photo card with a pager. Default layout (no JS, reduced motion, mobile) is a horizontal
 * snap-scroller with all three pairs visible; on desktop with motion, JS pins the stage and plays the
 * slide / blur / wipe sequence.
 */
export function Carousel({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const n = c.carousel.items.length;
  return (
    <section className={`section ${styles.section}`} data-carousel aria-labelledby="carousel-title">
      <div className={`container ${styles.head}`}>
        <MicroLabel>{c.carousel.label}</MicroLabel>
        <h2 id="carousel-title" className="t-h2" data-blur-in>
          {c.carousel.title}
        </h2>
        <p className={`t-lead ${styles.sub}`}>{c.carousel.sub}</p>
      </div>
      <div className={`container ${styles.stageWrap}`}>
        <div className={styles.stage} data-carousel-stage tabIndex={0} role="region" aria-label={c.carousel.title} data-lenis-prevent>
          {c.carousel.items.map((item, i) => (
            <div key={i} className={`${styles.pair} ${styles[`pair${i + 1}`]}`} data-pair={i + 1}>
              <div className={`${styles.card} ${styles.textCard} ${i === 2 ? styles.textCardTint : ""}`} data-text-card={i + 1}>
                <div className={styles.textInner} data-text-inner={i + 1}>
                  <h3 className={`t-h3 ${styles.cardTitle}`}>{item.title}</h3>
                  <p className={`t-body ${styles.cardBody}`}>{item.body}</p>
                </div>
                <p className={`t-micro ${styles.pager}`} data-pager={i + 1}>
                  <span data-pager-current>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.pagerTotal}>{String(n).padStart(2, "0")}</span>
                </p>
              </div>
              <div className={`${styles.card} ${styles.photoCard}`} data-photo-card={i + 1}>
                <MediaFrame image={carouselImages[i]?.image ?? null} ratio="4/5" lang={lang} radius="lg" decorative sizes="(max-width: 980px) 80vw, 36vw" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
