"use client";

import { useEffect } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { HERO_LIVE } from "@/components/sections/HeroFilm";
import { gsap, MQ, setupGsap } from "@/lib/motion";

/** From this point of the scroll (0–1) night has fallen: the film stops looping and rests on its last frame. */
const HOLD_AT = 0.7;
/** How far the facades come forward over the scroll, around the houses' centre. */
const ZOOM = 1.22;
/** Phones: the windows arrive this long after the film starts, once the boat has carried the headline in. */
const PHONE_DELAY = 4800;

/**
 * Nightfall on scroll (concept 2026-10-05). On desktop the hero holds (pinned) for a little over one viewport of
 * scroll while the scroll scrubs dusk: the copy leaves, the night film (same view, windows lit, a boat passing)
 * comes up over the day film and the boat canvas goes with the day, the whole view eases forward to ZOOM around
 * the houses; once it is dark the film finishes its crossing and rests on its last frame (which meets its first, so
 * nothing jumps), and the spotlight settles on the four project windows (the facades around them step back, their
 * frames come on) and they become live. A slow scrub and a little hysteresis on the live state keep it steady under a nervous wheel. Phones get no pin: the windows
 * arrive by themselves after the boat has passed, by day. Reduced motion: no pin, no night, the windows are
 * simply there. The hotspot layer carries `data-shown`; its CSS keeps the windows out of sight and out of the
 * tab order until then. Built once the hero is live (HeroFilm), so the tweens record its settled state.
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
        // The night film (HeroNightFilm) is client-only, so it is looked up here, a frame after the hero goes live;
        // unseen at opacity 0 first, and it starts loading now
        const nightFilm = hero.querySelector<HTMLVideoElement>("[data-hero-night-film]");
        if (nightFilm) {
          gsap.set(nightFilm, { opacity: 0 });
          nightFilm.preload = "auto";
          nightFilm.load();
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
              if (!nightFilm) return;
              // The night film runs while it can be seen; once night has fallen it stops looping and rests on its
              // last frame (ended), and a scroll back up lets it loop and resume (its last frame meets its first)
              nightFilm.loop = self.progress < HOLD_AT;
              const seen = self.progress > 0.01;
              if (!seen) {
                if (!nightFilm.paused) nightFilm.pause();
              } else if (nightFilm.paused && (nightFilm.loop || !nightFilm.ended)) nightFilm.play().catch(() => undefined);
            },
          },
        });
        if (copy) tl.to(copy, { opacity: 0, y: -24, duration: 0.3, ease: "none" }, 0);
        tl.to(targets, { scale: ZOOM, duration: 1, ease: "power1.inOut" }, 0);
        if (nightFilm) tl.to(nightFilm, { opacity: 1, duration: 0.62, ease: "power1.inOut" }, 0);
        if (canvas) tl.to(canvas, { opacity: 0, duration: 0.5, ease: "none" }, 0.2);
        if (spots) tl.to(spots, { opacity: 1, duration: 0.4, ease: "none" }, 0.55);
        tl.to(boxes, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "none" }, 0.6);
      };
      const start = () => {
        raf = requestAnimationFrame(build);
      };
      if (document.documentElement.hasAttribute("data-hero-live")) start();
      else document.addEventListener(HERO_LIVE, start, { once: true });
      return () => {
        document.removeEventListener(HERO_LIVE, start);
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
      if (document.documentElement.hasAttribute("data-hero-live")) arrive();
      else document.addEventListener(HERO_LIVE, arrive, { once: true });
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener(HERO_LIVE, arrive);
        layer.dataset.shown = "true";
      };
    });

    return () => mm.revert();
  }, []);
  return null;
}
