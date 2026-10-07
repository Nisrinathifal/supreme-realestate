"use client";

import { useEffect } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { HERO_LIVE } from "@/components/sections/HeroFilm";
import { gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/** From this point of the scroll (0–1) night has fallen: the film stops looping and rests on its last frame. */
const HOLD_AT = 0.7;
/** How far the facades come forward over the scroll, around the houses' centre. */
const ZOOM = 1.22;
/** The hero's pin, in viewports: dusk first, then the projects band slides up over the held hero (owner, 2026-10-07). */
const DUSK = 1.2;
const COVER = 1;

/**
 * Nightfall on scroll (concept 2026-10-05). The hero holds (pinned) for a little over one viewport of scroll while
 * the scroll scrubs dusk, then one viewport more while the projects band slides up over it (owner, 2026-10-07; the
 * band's windows-to-cards handoff is WorkMotion's). During dusk: the copy leaves, the night film (same view, windows lit, a boat passing)
 * comes up over the day film and the boat canvas goes with the day, the whole view eases forward to ZOOM around
 * the houses; once it is dark the film finishes its crossing and rests on its last frame (which meets its first, so
 * nothing jumps), and the spotlight settles on the four project windows (the facades around them step back, their
 * frames come on) and they become live. A slow scrub and a little hysteresis on the live state keep it steady under
 * a nervous wheel. Phones get the same dusk (their windows are off screen, so the projects deck under the hero is
 * the way in). Reduced motion: no pin, no night, the windows are simply there. The hotspot layer carries `data-shown`; its CSS keeps the windows out of sight and out of the
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

    mm.add(MQ.full, () => {
      layer.dataset.shown = "false";
      gsap.set(boxes, { opacity: 0 });
      gsap.set(targets, { transformOrigin: "50% 58%" });
      if (spots) gsap.set(spots, { opacity: 0 });
      let tl: gsap.core.Timeline | null = null;
      let dark: ScrollTrigger | null = null;
      // The projects band right after the hero is pulled up by the hero's height, so it rises over the held hero
      // during the pin's last viewport (COVER) and has covered it exactly as the pin lets go
      const band = document.querySelector<HTMLElement>("[data-work]");
      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      Object.assign(veil.style, { position: "absolute", inset: "0", zIndex: "6", pointerEvents: "none", background: "var(--night)", opacity: "0" });
      const overlap = () => {
        if (band) band.style.marginTop = `${-hero.offsetHeight}px`;
      };
      let raf = 0;
      let live = false;
      let isDark = false;
      const headerTheme = (toDark: boolean) => {
        if (toDark === isDark) return;
        isDark = toDark;
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
        if (band) gsap.set(band, { position: "relative", zIndex: 2 });
        hero.append(veil);
        overlap();
        ScrollTrigger.addEventListener("refreshInit", overlap);
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: `+=${(DUSK + COVER) * 100}%`,
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Progress through the dusk part of the pin (the rest is the band covering the hero)
              const dusk = Math.min(1, (self.progress * (DUSK + COVER)) / DUSK);
              if (dusk > 0.58) live = true;
              else if (dusk < 0.46) live = false;
              layer.dataset.shown = live ? "true" : "false";
              if (!nightFilm) return;
              // The night film runs while it can be seen; once night has fallen it stops looping and rests on its
              // last frame (ended), and a scroll back up lets it loop and resume (its last frame meets its first)
              nightFilm.loop = dusk < HOLD_AT;
              const seen = dusk > 0.01 && self.progress < 0.999;
              if (!seen) {
                if (!nightFilm.paused) nightFilm.pause();
              } else if (nightFilm.paused && (nightFilm.loop || !nightFilm.ended)) nightFilm.play().catch(() => undefined);
            },
          },
        });
        // The bar turns to Paper once the sky has gone dark, and stays so until the band has covered the hero (the
        // band, also dark, takes it from there)
        const pin = tl.scrollTrigger!;
        dark = ScrollTrigger.create({
          start: () => pin.start + 0.45 * ((pin.end - pin.start) * DUSK) / (DUSK + COVER),
          end: () => pin.end + 10,
          onToggle: (self) => headerTheme(self.isActive),
          onRefresh: (self) => headerTheme(self.isActive),
        });
        if (copy) tl.to(copy, { opacity: 0, y: -24, duration: 0.3, ease: "none" }, 0);
        tl.to(targets, { scale: ZOOM, duration: 1, ease: "power1.inOut" }, 0);
        if (nightFilm) tl.to(nightFilm, { opacity: 1, duration: 0.62, ease: "power1.inOut" }, 0);
        if (canvas) tl.to(canvas, { opacity: 0, duration: 0.5, ease: "none" }, 0.2);
        if (spots) tl.to(spots, { opacity: 1, duration: 0.4, ease: "none" }, 0.55);
        tl.to(boxes, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "none" }, 0.6);
        // Dusk takes the timeline's first unit. Over the cover part the night steps back under the rising band, like
        // a page under a sheet: the view eases a little away and dims (a veil of Supreme navy over the whole hero)
        tl.to({}, { duration: COVER / DUSK }, 1);
        tl.to(targets, { scale: ZOOM * 0.94, duration: COVER / DUSK, ease: "power1.in" }, 1);
        tl.fromTo(veil, { opacity: 0 }, { opacity: 0.6, duration: COVER / DUSK, ease: "power1.in" }, 1);
        ScrollTrigger.refresh();
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
        ScrollTrigger.removeEventListener("refreshInit", overlap);
        veil.remove();
        if (band) gsap.set(band, { clearProps: "marginTop,position,zIndex" });
        dark?.kill();
        tl?.scrollTrigger?.kill();
        tl?.kill();
        layer.dataset.shown = "true";
      };
    });

    mm.add(MQ.reduce, () => {
      layer.dataset.shown = "true";
    });

    return () => mm.revert();
  }, []);
  return null;
}
