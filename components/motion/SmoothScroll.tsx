"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

let instance: Lenis | null = null;
/** The running Lenis, for code that must scroll the page itself (the hero's window stops); null without it. */
export const getLenis = () => instance;

/**
 * Lenis smooth scroll wired to ScrollTrigger (REFERENCE §2). Only under
 * prefers-reduced-motion: no-preference; native scroll otherwise. Refreshes triggers after fonts load.
 */
export function SmoothScroll() {
  useEffect(() => {
    setupGsap();
    const mm = gsap.matchMedia();
    mm.add(MQ.full, () => {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: true });
      instance = lenis;
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        instance = null;
      };
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, []);
  return null;
}
