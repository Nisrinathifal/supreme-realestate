"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./WorkSlider.module.css";

type Props = { images: ImageAsset[]; lang: Lang; labels: { label: string; previous: string; nextSlide: string } };

/**
 * Row of photographs that scrolls sideways (native scroll with snap points), a thin progress line and two arrow
 * buttons after the reference. Without JavaScript the row still scrolls by hand; the buttons only add to that.
 */
export function WorkSlider({ images, lang, labels }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const raf = useRef(0);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? el.scrollLeft / max : 0;
      setProgress(p);
      setAtStart(el.scrollLeft <= 2);
      setAtEnd(max - el.scrollLeft <= 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); cancelAnimationFrame(raf.current); };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    // Snap positions relative to the track, then the next one in the direction asked
    const items = Array.from(el.querySelectorAll<HTMLElement>("li"));
    const base = items[0]?.offsetLeft ?? 0;
    const stops = items.map((li) => li.offsetLeft - base);
    const x = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    const next = dir > 0 ? (stops.find((p) => p > x + 2) ?? max) : ([...stops].reverse().find((p) => p < x - 2) ?? 0);
    const to = Math.min(max, next);
    cancelAnimationFrame(raf.current);
    if (prefersReducedMotion()) { el.scrollLeft = to; return; }
    // A short eased move written frame by frame (the browser's smooth scroll does not run under the page's
    // scroller); snapping is paused meanwhile, or every frame would snap back to the start
    const from = x, t0 = performance.now(), dur = 520;
    el.style.scrollSnapType = "none";
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.scrollLeft = from + (to - from) * e;
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else el.style.scrollSnapType = "";
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <div className={styles.slider}>
      <ul ref={track} className={styles.track} aria-label={labels.label} data-lenis-prevent>
        {images.map((img) => (
          <li key={img.src} className={img.height > img.width ? styles.tall : styles.wide}>
            <MediaFrame image={img} ratio={img.height > img.width ? "4/5" : "16/9"} lang={lang} radius="lg" sizes="(max-width: 767px) 80vw, 440px" />
          </li>
        ))}
      </ul>
      <div className={styles.bar}>
        <div className={styles.line} aria-hidden="true">
          <span className={styles.fill} style={{ transform: `scaleX(${Math.max(0.12, progress)})` }} />
        </div>
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={() => step(-1)} aria-label={labels.previous} disabled={atStart}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.button} onClick={() => step(1)} aria-label={labels.nextSlide} disabled={atEnd}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
