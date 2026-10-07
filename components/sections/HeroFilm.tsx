"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import type { VideoAsset } from "@/content/media";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Hero.module.css";

type Props = { film: VideoAsset; labels: { pause: string; play: string } };

/**
 * Fired on <document> once the hero is live: the film has started, or, without playback (reduced motion, Save-Data,
 * autoplay refused), after a moment. <html data-hero-live> is set at the same time for anything subscribing late.
 */
export const HERO_LIVE = "supreme:hero-live";
/** Fired on <document> when the headline starts to come in (HeroBoat): the cue for the header to arrive. */
export const HEADLINE_IN = "supreme:headline-in";
export const markHeroLive = () => {
  if (document.documentElement.hasAttribute("data-hero-live")) return;
  document.documentElement.setAttribute("data-hero-live", "");
  document.dispatchEvent(new CustomEvent(HERO_LIVE));
};

/**
 * Hero film over the still: starts (muted) as soon as it can, then either loops or plays
 * once and holds its last frame (`film.loop`). Its first frame matches the still. Reduced motion / Save-Data: no playback, the still stays. Pause control per
 * WCAG 2.2.2, visible on keyboard focus only.
 */
export function HeroFilm({ film, labels }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || prefersReducedMotion() || saveData()) {
      markHeroLive();
      return;
    }
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
    whenReady();
    // Autoplay refused or the network slow: the page goes on without the film after a moment
    const fallback = window.setTimeout(markHeroLive, 4000);
    return () => {
      window.clearTimeout(fallback);
      v.removeEventListener("canplay", start);
      v.removeEventListener("loadeddata", reveal);
    };
  }, [film.mp4, film.mp4Mobile, film.webm, film.rate]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.ended) v.currentTime = 0;
      delete v.dataset.userPaused;
      v.play().catch(() => undefined);
    } else {
      v.dataset.userPaused = ""; // HeroScroll never resumes a film the user stopped
      v.pause();
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        className={styles.video}
        data-revealed={revealed ? "true" : "false"}
        muted
        loop={film.loop}
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => {
          setPlaying(true);
          setRevealed(true);
          markHeroLive();
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
