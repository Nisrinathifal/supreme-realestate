"use client";

import { useEffect, useRef } from "react";
import type { VideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Steps.module.css";

/**
 * Looping illustration clip inside a step panel: muted, plays only while on screen, poster underneath.
 * Reduced motion / Save-Data: the poster only. The clip's own flat ground is feathered away by the mask
 * in the stylesheet, so the house sits on the panel without a visible rectangle.
 */
export function StepFilm({ film, lang }: { film: VideoAsset; lang: Lang }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion() || saveData()) return;
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    const chosen = (mobile && film.mp4Mobile) || film.mp4 || film.webm;
    if (chosen && !v.currentSrc.endsWith(chosen)) {
      v.src = chosen;
      v.load();
    }
    v.playbackRate = film.rate ?? 1;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [film.mp4, film.mp4Mobile, film.webm, film.rate]);

  return (
    <div className={styles.film}>
      <MediaFrame image={film.poster} ratio="fill" lang={lang} radius="none" decorative className={styles.filmPoster} sizes="(max-width: 980px) 90vw, 60vw" />
      {film.mp4 || film.webm ? (
        <video ref={ref} className={styles.filmVideo} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1}>
          {film.webm ? <source src={film.webm} type="video/webm" /> : null}
          {film.mp4 ? <source src={film.mp4} type="video/mp4" /> : null}
        </video>
      ) : null}
    </div>
  );
}
