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
 * Portrait screens (phones): the crop shows a few facades only, so once night has fallen the view walks along the
 * canal (the films' and the windows' horizontal anchor, `--pan`, 0 = left edge of the film, 1 = right) past all four
 * project windows, for this many viewports more, before the band covers it. Wide screens see all four at once.
 */
const WALK = 1.6;
const FILM = 16 / 9;

/**
 * Nightfall on scroll (concept 2026-10-05). The hero holds (pinned) for a little over one viewport of scroll while
 * the scroll scrubs dusk, then one viewport more while the projects band slides up over it (owner, 2026-10-07; the
 * band's windows-to-cards handoff is WorkMotion's). During dusk: the copy leaves, the night film (same view, windows lit, a boat passing)
 * comes up over the day film and the boat canvas goes with the day, the whole view eases forward to ZOOM around
 * the houses; once it is dark the film finishes its crossing and rests on its last frame (which meets its first, so
 * nothing jumps), and the spotlight settles on the four project windows (the facades around them step back, their
 * frames come on) and they become live. A slow scrub and a little hysteresis on the live state keep it steady under
 * a nervous wheel. Phones get the same dusk (their crop shows only some windows, so the projects deck under the hero is
 * the way in, and they walk along the canal past every window, WALK). Reduced motion: no pin, no night, the windows are simply there. The hotspot layer carries `data-shown`; its CSS keeps the windows out of sight and out of the
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
    // The windows' centres across the film (0–1), left to right, read from the hotspots' own percent boxes
    const centres = boxes
      .map((b) => (parseFloat(b.style.left) + parseFloat(b.style.width) / 2) / 100)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
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
      Object.assign(veil.style, { position: "absolute", inset: "0", zIndex: "6", pointerEvents: "none", background: "var(--band-dark)", opacity: "0" });
      const overlap = () => {
        if (band) band.style.marginTop = `${-hero.offsetHeight}px`;
      };
      let raf = 0;
      const warmTimerRef = { t: 0 };
      const warmNightRef = { f: () => undefined as void };
      let live = false;
      let isDark = false;
      const headerTheme = (toDark: boolean) => {
        if (toDark === isDark) return;
        isDark = toDark;
        document.dispatchEvent(new CustomEvent(HEADER_THEME, { detail: toDark ? "dark" : "light" }));
      };
      const build = () => {
        // A portrait screen walks the canal after dusk; `--pan` puts a window's centre (0–1 of the film) mid-screen
        const walk = window.innerWidth / window.innerHeight < 1 && centres.length > 0 ? WALK : 0;
        const panTo = (c: number) => () => {
          const W = hero.offsetWidth, F = Math.max(W, hero.offsetHeight * FILM);
          return F > W ? Math.min(1, Math.max(0, (c * F - W / 2) / (F - W))) : 0.5;
        };
        gsap.set(hero, { "--pan": 0.5 });
        // The night film (HeroNightFilm) is client-only, so it is looked up here, a frame after the hero goes live;
        // unseen at opacity 0 first, and it starts loading now
        const nightFilm = hero.querySelector<HTMLVideoElement>("[data-hero-night-film]");
        const dayFilm = hero.querySelector<HTMLVideoElement>("video:not([data-hero-night-film])");
        // The night film (6 MB) is fetched once the day film has had its moment, or at the first scroll, whichever
        // comes first, so the two never compete at the start
        let warmed = false;
        const warmNight = () => {
          if (warmed || !nightFilm) return;
          warmed = true;
          nightFilm.preload = "auto";
          nightFilm.load();
        };
        warmNightRef.f = warmNight;
        if (nightFilm) gsap.set(nightFilm, { opacity: 0 });
        warmTimerRef.t = window.setTimeout(warmNight, 1500);
        window.addEventListener("scroll", warmNight, { once: true, passive: true }); // (ScrollTrigger's own refresh is not a scroll)
        // The day film stops decoding once the band has covered the hero (60 fps 1080p, otherwise for the whole
        // page), and resumes on the way back up, unless the user stopped it (HeroFilm)
        const dayPause = () => dayFilm && !dayFilm.paused && dayFilm.pause();
        const dayResume = () => dayFilm && dayFilm.paused && !("userPaused" in dayFilm.dataset) && dayFilm.play().catch(() => undefined);
        if (band) gsap.set(band, { position: "relative", zIndex: 2 });
        hero.append(veil);
        overlap();
        ScrollTrigger.addEventListener("refreshInit", overlap);
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: `+=${(DUSK + walk + COVER) * 100}%`,
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            onLeave: dayPause,
            onEnterBack: dayResume,
            onUpdate: (self) => {
              // Progress through the dusk part of the pin (the rest is the band covering the hero)
              const dusk = Math.min(1, (self.progress * (DUSK + walk + COVER)) / DUSK);
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
          start: () => pin.start + 0.45 * ((pin.end - pin.start) * DUSK) / (DUSK + walk + COVER),
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
        // a page under a sheet: the view eases a little away and dims (a veil of the band's obsidian over the whole hero)
        // Portrait: the walk along the canal, first to the leftmost window, then right past the others to the last
        const after = 1 + walk / DUSK;
        if (walk) {
          const w = walk / DUSK;
          tl.to(hero, { "--pan": panTo(centres[0]), duration: w * 0.3, ease: "power1.inOut" }, 1)
            .to(hero, { "--pan": panTo(centres[centres.length - 1]), duration: w * 0.55, ease: "power1.inOut" }, 1 + w * 0.38);
        }
        tl.to({}, { duration: COVER / DUSK }, after);
        tl.to(targets, { scale: ZOOM * 0.94, duration: COVER / DUSK, ease: "power1.in" }, after);
        tl.fromTo(veil, { opacity: 0 }, { opacity: 0.6, duration: COVER / DUSK, ease: "power1.in" }, after);
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
        window.clearTimeout(warmTimerRef.t);
        window.removeEventListener("scroll", warmNightRef.f);
        headerTheme(false);
        ScrollTrigger.removeEventListener("refreshInit", overlap);
        veil.remove();
        hero.style.removeProperty("--pan");
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
