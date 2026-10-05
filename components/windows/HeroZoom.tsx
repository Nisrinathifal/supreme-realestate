"use client";

import { useEffect } from "react";
import { INTRO_DONE } from "@/components/sections/HeroFilm";
import { gsap, MQ, setupGsap } from "@/lib/motion";

/** How far the facades come forward before the windows show. */
const ZOOM = 1.45;
/** Phones: the windows arrive this long after the intro, once the boat has carried the headline in. */
const PHONE_DELAY = 4800;

/**
 * Scroll into the facades (concept 2026-10-05). On desktop the hero holds (pinned) for one extra viewport of scroll:
 * the copy leaves, the film, the boat canvas and the hotspot layer move forward together to ZOOM around the
 * facades, and only then do the four project windows draw in. Phones get no pin: the windows arrive by
 * themselves after the boat has passed. Reduced motion: no pin, no zoom, the windows are simply there.
 * The hotspot layer carries `data-shown`; its CSS keeps the windows out of sight and out of the tab order until then.
 * Built once the intro is over, so the tweens record the hero's settled state (the preloader animates the copy
 * and the frame from its own start states) rather than the intro's.
 */
export function HeroZoom() {
  useEffect(() => {
    setupGsap();
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const layer = hero?.querySelector<HTMLElement>("[data-windows]");
    if (!hero || !layer) return;
    const frame = hero.querySelector<HTMLElement>("[data-hero-frame]");
    const canvas = hero.querySelector<HTMLElement>("canvas");
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const boxes = Array.from(layer.querySelectorAll<HTMLElement>("[data-window]"));
    const targets = [frame, canvas, layer].filter((el): el is HTMLElement => Boolean(el));
    const mm = gsap.matchMedia();

    mm.add(`${MQ.full} and ${MQ.desktop}`, () => {
      layer.dataset.shown = "false";
      gsap.set(targets, { transformOrigin: "50% 60%" });
      gsap.set(boxes, { opacity: 0 });
      let tl: gsap.core.Timeline | null = null;
      const build = () => {
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=110%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            onUpdate: (self) => {
              layer.dataset.shown = self.progress > 0.78 ? "true" : "false";
            },
          },
        });
        if (copy) tl.to(copy, { opacity: 0, y: -24, duration: 0.25, ease: "none" }, 0);
        tl.to(targets, { scale: ZOOM, duration: 1, ease: "power1.inOut" }, 0).to(boxes, { opacity: 1, duration: 0.18, stagger: 0.05, ease: "none" }, 0.78);
      };
      if (document.documentElement.hasAttribute("data-preloader-skip")) build();
      else document.addEventListener(INTRO_DONE, build, { once: true });
      return () => {
        document.removeEventListener(INTRO_DONE, build);
        tl?.scrollTrigger?.kill();
        tl?.kill();
        layer.dataset.shown = "true";
      };
    });

    mm.add(`${MQ.reduce}, (max-width: 767px)`, (ctx) => {
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
      ctx.add(() => undefined);
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
