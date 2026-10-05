"use client";

import { useEffect } from "react";
import { SplitText } from "gsap/SplitText";
import { ease, gsap, prefersReducedMotion, saveData, setupGsap } from "@/lib/motion";
import { INTRO_DONE } from "./HeroFilm";

type Props = { path: [number, number][] };

/** The lead follows a little behind the headline, as a fraction of the drawn film width. */
const LEAD_LAG = 0.05;
/** If the film has not started this long after the intro, or stays paused this long, the copy simply appears. */
const STALL_MS = 2500;

/** x (fraction of the film width) of the subject at time t, linear between the measured points. */
function along(path: [number, number][], t: number) {
  if (t <= path[0][0]) return path[0][1];
  for (let i = 1; i < path.length; i++) {
    const [t1, x1] = path[i];
    if (t <= t1) {
      const [t0, x0] = path[i - 1];
      return x0 + ((x1 - x0) * (t - t0)) / (t1 - t0);
    }
  }
  return path[path.length - 1][1];
}

/**
 * Hero copy carried in by the boat (concept 3): headline letters and lead words rise into place as the boat's bow
 * passes beneath them on screen, once, on the film's first crossing. The bow is mapped from the film (object-fit
 * cover, anchored top centre) to viewport x every frame. Start states are set here, in JS; reduced motion,
 * Save-Data, a film that will not play or that stays paused before the crossing all leave or bring the copy in full view.
 */
export function HeroReveal({ path }: Props) {
  useEffect(() => {
    if (prefersReducedMotion() || saveData()) return;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const video = hero?.querySelector<HTMLVideoElement>("video");
    const title = hero?.querySelector<HTMLElement>("[data-hero-title]");
    const lead = hero?.querySelector<HTMLElement>("[data-hero-lead]");
    if (!hero || !video || !title || !lead) return;
    setupGsap();
    gsap.registerPlugin(SplitText);

    let cancelled = false;
    let splits: SplitText[] = [];
    let pending: { el: HTMLElement; lag: number; x: number | null }[] = [];
    let raf = 0;
    let stall = 0;

    const show = (els: HTMLElement[], stagger = 0) =>
      gsap.to(els, { opacity: 1, xPercent: 0, yPercent: 0, duration: 0.7, ease: ease.brand, stagger, overwrite: true });

    const finish = () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stall);
      if (pending.length) show(pending.map((p) => p.el), 0.015);
      pending = [];
    };

    const tick = () => {
      const r = video.getBoundingClientRect();
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      const drawn = vw * Math.max(r.width / vw, r.height / vh);
      const left = r.left + (r.width - drawn) / 2;
      const bow = left + along(path, video.currentTime) * drawn;
      const passed: HTMLElement[] = [];
      pending = pending.filter((p) => {
        if (p.x === null) {
          const b = p.el.getBoundingClientRect();
          p.x = b.left + b.width / 2;
        }
        if (p.x + p.lag * drawn > bow) return true;
        passed.push(p.el);
        return false;
      });
      if (passed.length) show(passed);
      if (pending.length) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      window.clearTimeout(stall);
      if (!pending.length) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const remeasure = () => pending.forEach((p) => (p.x = null));
    const watch = () => {
      window.clearTimeout(stall);
      stall = window.setTimeout(() => {
        if (video.paused) finish();
      }, STALL_MS);
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      // Only the first crossing carries the copy: a film already past it leaves the copy as it is
      if (video.currentTime > path[0][0] + 0.5) return;
      splits = [new SplitText(title, { type: "words,chars" }), new SplitText(lead, { type: "words" })];
      pending = [
        ...(splits[0].chars as HTMLElement[]).map((el) => ({ el, lag: 0, x: null })),
        ...(splits[1].words as HTMLElement[]).map((el) => ({ el, lag: LEAD_LAG, x: null })),
      ];
      gsap.set(pending.map((p) => p.el), { opacity: 0, xPercent: -30, yPercent: 40 });
      video.addEventListener("playing", start);
      video.addEventListener("pause", watch);
      video.addEventListener("error", finish);
      window.addEventListener("resize", remeasure);
      if (!video.paused) start();
      else if (document.documentElement.hasAttribute("data-preloader-skip")) watch();
      else document.addEventListener(INTRO_DONE, watch, { once: true });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(stall);
      video.removeEventListener("playing", start);
      video.removeEventListener("pause", watch);
      video.removeEventListener("error", finish);
      window.removeEventListener("resize", remeasure);
      document.removeEventListener(INTRO_DONE, watch);
      gsap.killTweensOf(pending.map((p) => p.el));
      splits.forEach((s) => s.revert());
    };
  }, [path]);

  return null;
}
