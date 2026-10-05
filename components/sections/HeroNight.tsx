"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { VideoAsset } from "@/content/media";
import { gsap } from "@/lib/motion";
import styles from "./Hero.module.css";

const noop = () => () => {};
const useClient = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * The night film over the day film: the same view after dark, windows lit. Client-only and unseen until the scroll
 * brings dusk (components/windows/HeroScroll sets its opacity and runs it); nothing is fetched before that.
 * Reduced motion and phones never show it. One source, chosen once, like HeroFilm.
 */
export function HeroNight({ film }: { film: VideoAsset }) {
  const mounted = useClient();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    const chosen = (mobile && film.mp4Mobile) || film.mp4 || film.webm;
    if (chosen) v.src = chosen;
    gsap.set(v, { opacity: 0 });
  }, [mounted, film.mp4, film.mp4Mobile, film.webm]);
  if (!mounted) return null;
  return <video ref={ref} className={styles.night} data-hero-night muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />;
}
