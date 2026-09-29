"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import type { VideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./HeroFilm.module.css";

type Props = { film: VideoAsset; lang: Lang; labels: { pause: string; play: string } };

/**
 * Hero film (DESIGN §9.10). The poster is always in the HTML and is the LCP element. The video has no
 * autoplay attribute: JavaScript starts it only without reduced motion and without Save-Data, then wipes it
 * in over the poster (P7 clip wipe). The pause/play pill is always visible while a film exists.
 */
export function HeroFilm({ film, lang, labels }: Props) {
  const hasFilm = Boolean(film.mp4 || film.webm);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasFilm) return;
    if (prefersReducedMotion() || saveData()) return;
    const start = () => v.play().catch(() => undefined);
    if (v.readyState >= 3) start();
    else v.addEventListener("canplay", start, { once: true });
    return () => v.removeEventListener("canplay", start);
  }, [hasFilm]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  return (
    <>
      <div className={styles.layer} data-hero-film-layer>
        <MediaFrame image={film.poster} ratio="fill" lang={lang} radius="none" priority decorative className={styles.poster} />
        {hasFilm ? (
          <video
            ref={videoRef}
            className={styles.video}
            data-revealed={revealed ? "true" : "false"}
            muted
            loop
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
      </div>
      {hasFilm ? (
        <button type="button" className={styles.control} onClick={toggle} aria-pressed={playing}>
          {playing ? <Pause size={18} weight="light" aria-hidden="true" /> : <Play size={18} weight="light" aria-hidden="true" />}
          <span>{playing ? labels.pause : labels.play}</span>
        </button>
      ) : null}
    </>
  );
}
