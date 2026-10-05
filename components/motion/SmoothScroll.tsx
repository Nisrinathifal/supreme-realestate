"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

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
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
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
