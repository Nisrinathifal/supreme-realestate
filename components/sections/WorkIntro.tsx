import type { CSSProperties } from "react";
import { AlphaImage } from "@/components/ui/AlphaImage";
import { mascots } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { WorkIntroMotion } from "./WorkIntroMotion";
import styles from "./WorkIntro.module.css";

/** Where each mascot sits on the ring: angle in degrees, radius factor, size factor, in front of or behind the line. */
const ring = [
  { a: -118, k: 1, s: 1.05, front: false },
  { a: -62, k: 0.92, s: 0.9, front: true },
  { a: -8, k: 1.04, s: 1, front: false },
  { a: 44, k: 0.96, s: 1.1, front: true },
  { a: 96, k: 1, s: 0.95, front: false },
  { a: 150, k: 0.9, s: 1.15, front: true },
  { a: 206, k: 1.02, s: 0.9, front: false },
];
const RX = 39; // % of the stage width
const RY = 37; // % of the stage height

/**
 * Projects intro (concept 2026-10-02, after the reference's "see more work" band): a white viewport with the headline
 * in the middle and the seven mascots on a ring around it. The CSS places them; WorkIntroMotion pins the band for
 * about 2.5 viewports and drives everything from the scroll in four stages: the mascots come in from outside while
 * the headline appears line by line, settle into an asymmetric composition around it, float a little, then move
 * outward as the page scrolls on into the projects. Hover tilts a
 * mascot towards the pointer. Reduced motion and no-JS: the full headline and the still ring. Slides up over the
 * held steps strip (`data-overlap`).
 */
export function WorkIntro({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="work" className={styles.intro} data-work-intro data-overlap aria-labelledby="work-intro-title">
      <WorkIntroMotion>
        <div className={styles.stage} data-orbit aria-hidden="true">
          {mascots.map((m, i) => {
            const p = ring[i % ring.length];
            const rad = (p.a * Math.PI) / 180;
            const style = {
              left: `${50 + RX * p.k * Math.cos(rad)}%`,
              top: `${50 + RY * p.k * Math.sin(rad)}%`,
              "--s": p.s,
            } as CSSProperties;
            return (
              <div key={m.src} className={p.front ? `${styles.item} ${styles.front}` : styles.item} style={style} data-orbit-item data-angle={p.a} data-k={p.k} data-front={p.front ? 1 : 0}>
                <div className={styles.inner} data-orbit-inner>
                  <div className={styles.tilt} data-orbit-tilt>
                    <AlphaImage image={m} lang={lang} size={200} className={styles.image} decorative />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <h2 id="work-intro-title" className={styles.title}>
          {c.work.intro.map((line, i) => (
            <span key={i} className={styles.line}>
              <span className={styles.lineInner} data-orbit-line>
                {line}
              </span>
            </span>
          ))}
        </h2>
      </WorkIntroMotion>
    </section>
  );
}
