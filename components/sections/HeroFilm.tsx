"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import type { VideoAsset } from "@/content/media";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Hero.module.css";

type Props = { film: VideoAsset; labels: { pause: string; play: string } };

/** Fired by the intro (Preloader) when the hero is fully on screen, or at once when the intro is skipped. */
export const INTRO_DONE = "supreme:intro-done";

/**
 * Hero film over the still: plays once (muted) after the intro has revealed the hero and holds its last frame,
 * which matches the still. Reduced motion / Save-Data: no playback, the still stays. Pause control per
 * WCAG 2.2.2, visible on keyboard focus only.
 */
export function HeroFilm({ film, labels }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || prefersReducedMotion() || saveData()) return;
    // One source, chosen once (a <source media> pair makes the browser reload and reset on breakpoint changes)
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    const chosen = (mobile && film.mp4Mobile) || film.mp4 || film.webm;
    if (chosen && !v.currentSrc.endsWith(chosen)) {
      v.src = chosen;
      v.load();
    }
    v.playbackRate = film.rate ?? 1;
    // Show the first frame (the house as a shell) as soon as it is decoded: the intro grows this frame
    const reveal = () => setRevealed(true);
    if (v.readyState >= 2) reveal();
    else v.addEventListener("loadeddata", reveal, { once: true });
    const start = () => {
      if (!v.paused || v.ended) return;
      v.play().catch(() => undefined);
    };
    const whenReady = () => {
      if (v.readyState >= 3) start();
      else v.addEventListener("canplay", start, { once: true });
    };
    const introDone = document.documentElement.hasAttribute("data-preloader-skip");
    if (introDone) whenReady();
    else document.addEventListener(INTRO_DONE, whenReady, { once: true });
    return () => {
      document.removeEventListener(INTRO_DONE, whenReady);
      v.removeEventListener("canplay", start);
      v.removeEventListener("loadeddata", reveal);
    };
  }, [film.mp4, film.mp4Mobile, film.webm, film.rate]);

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
      <video
        ref={videoRef}
        className={styles.video}
        data-revealed={revealed ? "true" : "false"}
        muted
        playsInline
        preload="auto"
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
      <button type="button" className={styles.control} onClick={toggle} aria-pressed={playing}>
        {playing ? <Pause size={18} weight="light" aria-hidden="true" /> : <Play size={18} weight="light" aria-hidden="true" />}
        <span>{playing ? labels.pause : labels.play}</span>
      </button>
    </>
  );
}
