import type { CSSProperties } from "react";
import { AlphaImage } from "@/components/ui/AlphaImage";
import { mascots, orbitCards } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { WorkIntroMotion } from "./WorkIntroMotion";
import styles from "./WorkIntro.module.css";

/**
 * The ring: the four cards and four of the mascots, alternating, evenly spaced from the top. Each item has a radius
 * factor and a size factor, and sits in front of or behind the headline by turns.
 */
const COUNT = 8;
const ring = Array.from({ length: COUNT }, (_, i) => ({
  a: -90 + (360 / COUNT) * i,
  k: i % 4 === 1 ? 0.94 : i % 4 === 3 ? 1.04 : 1,
  s: i % 2 === 0 ? 1 : i % 4 === 1 ? 0.95 : 1.05,
  front: i % 2 === 1,
}));
const RX = 39; // % of the stage width
const RY = 37; // % of the stage height
/** Cards and mascots by turns: even places a card, odd places a mascot (four of the seven). */
const orbit = ring.map((_, i) => (i % 2 === 0 ? { kind: "card" as const, image: orbitCards[i / 2] } : { kind: "mascot" as const, image: mascots[(i - 1) / 2] }));

/**
 * Projects intro (concept 2026-10-02, after the reference's "see more work" band): a white viewport with the headline
 * in the middle and, on a ring around it, the four owner-supplied cards and four mascots by turns. The page's band
 * tone moves from white to Sky mist as it comes in (WorkIntroMotion) and back to white inside the projects band. The CSS places them; WorkIntroMotion (after the reference
 * recordings) turns the ring slowly when the page rests and at the scrolling pace when it scrolls, draws the ring
 * closer and fills the headline in word by word under the pointer, and lets the mascots lag behind as the band
 * scrolls on into the projects. Hover tilts a
 * mascot towards the pointer. Reduced motion and no-JS: the full headline and the still ring. Slides up over the
 * held steps strip (`data-overlap`).
 */
export function WorkIntro({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="work" className={styles.intro} data-work-intro data-overlap aria-labelledby="work-intro-title">
      <WorkIntroMotion>
        <div className={styles.stage} data-orbit aria-hidden="true">
          {orbit.map((o, i) => {
            const m = o.image;
            const p = ring[i];
            const rad = (p.a * Math.PI) / 180;
            const style = {
              left: `${50 + RX * p.k * Math.cos(rad)}%`,
              top: `${50 + RY * p.k * Math.sin(rad)}%`,
              "--s": p.s,
            } as CSSProperties;
            return (
              <div key={m.src} className={[styles.item, o.kind === "card" ? styles.card : styles.mascot, p.front ? styles.front : ""].filter(Boolean).join(" ")} style={style} data-orbit-item data-angle={p.a} data-k={p.k} data-front={p.front ? 1 : 0}>
                <div className={styles.inner} data-orbit-inner>
                  <div className={styles.tilt} data-orbit-tilt>
                    <AlphaImage image={m} lang={lang} size={o.kind === "card" ? 240 : 160} className={styles.image} decorative />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <h2 id="work-intro-title" className={styles.title} data-orbit-title>
          {c.work.intro.map((line, i) => (
            <span key={i} className={styles.line} data-orbit-line>
              {line.split(" ").map((word, j) => (
                <span key={j} className={styles.word} data-orbit-word>
                  {word}
                </span>
              ))}
            </span>
          ))}
        </h2>
      </WorkIntroMotion>
    </section>
  );
}
