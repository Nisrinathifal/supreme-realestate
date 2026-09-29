"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import type { VideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Hero.module.css";

type Props = {
  film: VideoAsset;
  lang: Lang;
  headline: string;
  keyMessage: string;
  labels: { pause: string; play: string };
};

/**
 * Hero: headline and key message in the sky band, the film below it at its full frame. The film autoplays once
 * (muted) and holds its last frame. Reduced motion / Save-Data: no playback, the finished last frame is shown.
 */
export function HeroStory({ film, lang, headline, keyMessage, labels }: Props) {
  const hasFilm = Boolean(film.mp4 || film.webm);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasFilm) return;
    // One source, chosen once (a <source media> pair makes the browser reload and reset on breakpoint changes)
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    const chosen = (mobile && film.mp4Mobile) || film.mp4 || film.webm;
    if (chosen && !v.currentSrc.endsWith(chosen)) {
      v.src = chosen;
      v.load();
    }

    if (prefersReducedMotion() || saveData()) {
      v.pause();
      const toEnd = () => {
        if (Number.isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05);
      };
      const onSeeked = () => setRevealed(true);
      if (v.readyState >= 1) toEnd();
      v.addEventListener("loadedmetadata", toEnd, { once: true });
      v.addEventListener("seeked", onSeeked, { once: true });
      return () => {
        v.removeEventListener("loadedmetadata", toEnd);
        v.removeEventListener("seeked", onSeeked);
      };
    }

    const start = () => {
      if (!v.paused || v.ended) return;
      v.play().then(
        () => v.setAttribute("data-autoplay", "ok"),
        () => v.setAttribute("data-autoplay", "refused"),
      );
    };
    if (v.readyState >= 3) start();
    v.addEventListener("canplay", start, { once: true });
    return () => v.removeEventListener("canplay", start);
  }, [hasFilm, film.mp4, film.mp4Mobile, film.webm]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => undefined);
    } else v.pause();
  };

  return (
    <>
      <div className={styles.media} data-hero-media>
        <MediaFrame image={film.poster} ratio="fill" lang={lang} radius="none" priority decorative className={styles.poster} />
        {hasFilm ? (
          <video
            ref={videoRef}
            className={styles.video}
            data-revealed={revealed ? "true" : "false"}
            autoPlay
            muted
            playsInline
            preload="metadata"
            poster={film.poster ? `/media/${film.poster.src}-1280.jpg` : undefined}
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => {
              setPlaying(true);
              setRevealed(true);
            }}
            onPause={() => setPlaying(false)}
          >
            {film.webm ? <source src={film.webm} type="video/webm" /> : null}
            {film.mp4 ? <source src={film.mp4} type="video/mp4" /> : null}
          </video>
        ) : null}
        {/* real element after the video: a ::before on the wrapper does not reliably paint above a video layer */}
        <div className={styles.seam} aria-hidden="true" />
      </div>

      <div className={styles.copy}>
        <div className={styles.clouds} aria-hidden="true" />
        <div className={styles.final}>
          <h1 id="hero-title" className={styles.title}>
            {headline}
          </h1>
          <p className={styles.lead}>{keyMessage}</p>
        </div>
      </div>

      {hasFilm ? (
        // Visually hidden until keyboard focus: keeps the WCAG 2.2.2 pause mechanism without a visible pill.
        <button type="button" className={styles.control} onClick={toggle} aria-pressed={playing}>
          {playing ? <Pause size={18} weight="light" aria-hidden="true" /> : <Play size={18} weight="light" aria-hidden="true" />}
          <span>{playing ? labels.pause : labels.play}</span>
        </button>
      ) : null}
    </>
  );
}
