"use client";

import { useEffect } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { INTRO_DONE } from "@/components/sections/HeroFilm";
import { gsap, MQ, setupGsap } from "@/lib/motion";

/** How far the facades come forward over the scroll, around the houses' centre. */
const ZOOM = 1.22;
/** Phones: the windows arrive this long after the intro, once the boat has carried the headline in. */
const PHONE_DELAY = 4800;

/**
 * Nightfall on scroll (concept 2026-10-05). On desktop the hero holds (pinned) for a little over one viewport of
 * scroll while the scroll scrubs dusk: the copy leaves, the night film (same view, windows lit) comes up over the
 * day film and the boat canvas goes with the day, the whole view eases forward to ZOOM around the houses, then the
 * spotlight settles on the four project windows (the facades around them step back, their frames come on) and
 * they become live. A slow scrub and a little hysteresis on the live state keep it steady under a nervous wheel. Phones get no pin: the windows
 * arrive by themselves after the boat has passed, by day. Reduced motion: no pin, no night, the windows are
 * simply there. The hotspot layer carries `data-shown`; its CSS keeps the windows out of sight and out of the
 * tab order until then. Built once the intro is over, so the tweens record the hero's settled state.
 */
export function HeroScroll() {
  useEffect(() => {
    setupGsap();
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const layer = hero?.querySelector<HTMLElement>("[data-windows]");
    if (!hero || !layer) return;
    const frame = hero.querySelector<HTMLElement>("[data-hero-frame]");
    const canvas = hero.querySelector<HTMLElement>("canvas");
    const targets = [frame, canvas, layer].filter((el): el is HTMLElement => Boolean(el));
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const spots = layer.querySelector<HTMLElement>("[data-spots]");
    const boxes = Array.from(layer.querySelectorAll<HTMLElement>("[data-window]"));
    const mm = gsap.matchMedia();

    mm.add(`${MQ.full} and ${MQ.desktop}`, () => {
      layer.dataset.shown = "false";
      gsap.set(boxes, { opacity: 0 });
      gsap.set(targets, { transformOrigin: "50% 58%" });
      if (spots) gsap.set(spots, { opacity: 0 });
      let tl: gsap.core.Timeline | null = null;
      let raf = 0;
      let live = false;
      let dark = false;
      const headerTheme = (toDark: boolean) => {
        if (toDark === dark) return;
        dark = toDark;
        document.dispatchEvent(new CustomEvent(HEADER_THEME, { detail: toDark ? "dark" : "light" }));
      };
      const build = () => {
        // The night film is client-only (HeroNight), so it is looked up here, a frame after the intro, not at mount;
        // it starts loading now, so dusk never waits on the network
        const night = hero.querySelector<HTMLVideoElement>("[data-hero-night]");
        if (night) {
          gsap.set(night, { opacity: 0 });
          night.preload = "auto";
          night.load();
        }
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (self.progress > 0.58) live = true;
              else if (self.progress < 0.46) live = false;
              layer.dataset.shown = live ? "true" : "false";
              headerTheme(self.progress > 0.45); // the bar turns to Paper once the sky has gone dark
              if (!night) return;
              // The night film only runs while it can be seen
              if (self.progress > 0.01) {
                if (night.paused) night.play().catch(() => undefined);
              } else if (!night.paused) night.pause();
            },
          },
        });
        if (copy) tl.to(copy, { opacity: 0, y: -24, duration: 0.3, ease: "none" }, 0);
        tl.to(targets, { scale: ZOOM, duration: 1, ease: "power1.inOut" }, 0);
        if (night) tl.to(night, { opacity: 1, duration: 0.8, ease: "none" }, 0);
        if (canvas) tl.to(canvas, { opacity: 0, duration: 0.5, ease: "none" }, 0.2);
        if (spots) tl.to(spots, { opacity: 1, duration: 0.4, ease: "none" }, 0.55);
        tl.to(boxes, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "none" }, 0.6);
      };
      const start = () => {
        raf = requestAnimationFrame(build);
      };
      if (document.documentElement.hasAttribute("data-preloader-skip")) start();
      else document.addEventListener(INTRO_DONE, start, { once: true });
      return () => {
        document.removeEventListener(INTRO_DONE, start);
        cancelAnimationFrame(raf);
        headerTheme(false);
        tl?.scrollTrigger?.kill();
        tl?.kill();
        layer.dataset.shown = "true";
      };
    });

    mm.add(`${MQ.reduce}, (max-width: 767px)`, () => {
      const reduced = window.matchMedia(MQ.reduce).matches;
      if (reduced) {
        layer.dataset.shown = "true";
        return;
      }
      layer.dataset.shown = "false";
      gsap.set(boxes, { opacity: 0 });
      let timer = 0;
      const arrive = () => {
        timer = window.setTimeout(() => {
          layer.dataset.shown = "true";
          gsap.to(boxes, { opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" });
        }, PHONE_DELAY);
      };
      if (document.documentElement.hasAttribute("data-preloader-skip")) arrive();
      else document.addEventListener(INTRO_DONE, arrive, { once: true });
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener(INTRO_DONE, arrive);
        layer.dataset.shown = "true";
      };
    });

    return () => mm.revert();
  }, []);
  return null;
}
