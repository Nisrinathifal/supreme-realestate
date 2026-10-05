"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { VideoAsset } from "@/content/media";
import { gsap } from "@/lib/motion";
import styles from "./Hero.module.css";

const noop = () => () => {};
const useClient = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * The night film layer (see HeroNight). Client-only; HeroScroll lets it load after the intro, scrubs its opacity
 * and runs it only while it can be seen. One source, chosen once, like HeroFilm.
 */
export function HeroNightFilm({ film }: { film: VideoAsset }) {
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
  return <video ref={ref} className={styles.nightFilm} data-hero-night-film muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />;
}
