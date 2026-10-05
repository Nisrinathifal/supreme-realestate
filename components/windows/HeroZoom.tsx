"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/motion/SmoothScroll";
import { INTRO_DONE } from "@/components/sections/HeroFilm";
import { gsap, MQ, setupGsap } from "@/lib/motion";

/** Fired on <document> when the scroll camera stops at a window (detail: its project id) or leaves it (null). */
export const WINDOW_FOCUS = "supreme:window-focus";

/** At a stop the window stands this share of the hero's height tall, up to MAX_ZOOM times the plain view. */
const WINDOW_FILL = 0.34;
const MAX_ZOOM = 4.2;
/** Scroll-time units: one move between windows, and the hold at each stop. */
const MOVE = 1;
const HOLD = 0.45;
/** Snapping: after the scroll has rested this long, the camera settles on a stop; a nudge shorter than NUDGE px goes back. */
const SETTLE_MS = 140;
const NUDGE = 40;
/** Phones: the windows arrive this long after the intro, once the boat has carried the headline in. */
const PHONE_DELAY = 4800;

/**
 * Scroll into the windows (concept 2026-10-05, after the storyboard). On desktop the hero holds (pinned) while the
 * scroll drives a camera over the film, the boat canvas and the hotspot layer together: from the plain view it
 * pushes in hard on the first project window, holds there with the window lit and its preview beside it, then
 * travels to the next window, and the next, and after the fourth eases back out to the facades with all four
 * frames showing. Once the scroll rests, the camera settles on the next stop in the direction travelled (or back on
 * the one it left after a mere nudge), so each step of the wheel lands on a window. The stop in view is
 * announced with WINDOW_FOCUS so Windows can light it and show its preview; `--inv` on the layer carries
 * 1 / zoom so frame lines and the vignette keep their size on screen.
 * Phones get no pin: the windows arrive by themselves after the boat has passed. Reduced motion: no pin, no zoom,
 * the windows are simply there. Built once the intro is over, so the tweens record the hero's settled state.
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
    const focus = (id: string | null) => document.dispatchEvent(new CustomEvent(WINDOW_FOCUS, { detail: id }));
    const mm = gsap.matchMedia();

    mm.add(`${MQ.full} and ${MQ.desktop}`, () => {
      layer.dataset.shown = "false";
      gsap.set(targets, { transformOrigin: "0 0" });
      gsap.set(boxes, { opacity: 0 });
      let tl: gsap.core.Timeline | null = null;
      let focused: string | null = null;
      let settle = 0;
      let restedAt: number | null = null; // scroll position of the stop the camera last rested on

      // Scroll positions of the stops (start, the windows, out)
      const stopsPx = () => {
        const st = tl?.scrollTrigger;
        if (!tl || !st) return [];
        const span = st.end - st.start;
        return Object.values(tl.labels)
          .map((t) => st.start + (t / tl!.duration()) * span)
          .sort((a, b) => a - b);
      };
      const snap = () => {
        const st = tl?.scrollTrigger;
        if (!st || !st.isActive) return;
        const stops = stopsPx();
        const here = window.scrollY;
        const nearest = stops.reduce((a, b) => (Math.abs(b - here) < Math.abs(a - here) ? b : a));
        if (Math.abs(nearest - here) < 2) {
          restedAt = nearest;
          return;
        }
        const from = restedAt ?? nearest;
        let target = nearest;
        if (Math.abs(here - from) < NUDGE) target = from;
        else if (here > from) target = stops.find((s) => s > from + 1) ?? nearest;
        else target = [...stops].reverse().find((s) => s < from - 1) ?? nearest;
        restedAt = target;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(target, { duration: 0.9, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
        else window.scrollTo({ top: target, behavior: "smooth" });
      };

      // Camera for a window: scale and translation (origin top left) that put its centre mid-hero, WINDOW_FILL tall.
      // The hotspot layer is laid out like the cover-fitted film, so its box's percentages are read back from it.
      const cameraFor = (box: HTMLElement) => {
        const hw = hero.clientWidth;
        const hh = hero.clientHeight;
        const fw = Math.max(hw, (hh * 16) / 9);
        const fh = Math.max(hh, (hw * 9) / 16);
        const x = parseFloat(box.style.left);
        const y = parseFloat(box.style.top);
        const w = parseFloat(box.style.width);
        const h = parseFloat(box.style.height);
        const cx = (hw - fw) / 2 + ((x + w / 2) / 100) * fw;
        const cy = ((y + h / 2) / 100) * fh;
        const scale = Math.min(MAX_ZOOM, (WINDOW_FILL * hh) / ((h / 100) * fh));
        return { scale, x: hw / 2 - cx * scale, y: hh / 2 - cy * scale };
      };

      const build = () => {
        tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: `+=${Math.round((boxes.length * (MOVE + HOLD) + MOVE) * 100)}%`,
            pin: true,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (!tl) return;
              window.clearTimeout(settle);
              settle = window.setTimeout(snap, SETTLE_MS);
              const t = self.progress * tl.duration();
              layer.dataset.shown = self.progress > 0.015 ? "true" : "false";
              layer.style.setProperty("--inv", String(1 / (Number(gsap.getProperty(layer, "scale")) || 1)));
              // The stop whose hold the camera is in (a little grace either side), or none
              let at: string | null = null;
              boxes.forEach((b, i) => {
                const start = tl!.labels[`w${i}`];
                if (t >= start - 0.12 && t <= start + HOLD + 0.12) at = b.dataset.window ?? null;
              });
              if (at !== focused) {
                focused = at;
                focus(at);
              }
            },
          },
        });
        tl.addLabel("start", 0);
        if (copy) tl.to(copy, { opacity: 0, y: -24, duration: 0.3, ease: "none" }, 0);
        tl.to(boxes, { opacity: 1, duration: 0.3, stagger: 0.04, ease: "none" }, 0.1);
        let at = 0;
        boxes.forEach((box, i) => {
          tl!.to(targets, { scale: () => cameraFor(box).scale, x: () => cameraFor(box).x, y: () => cameraFor(box).y, duration: MOVE, ease: "power2.inOut" }, at);
          at += MOVE;
          tl!.addLabel(`w${i}`, at);
          at += HOLD;
        });
        tl.to(targets, { scale: 1, x: 0, y: 0, duration: MOVE, ease: "power2.inOut" }, at);
        tl.addLabel("out", at + MOVE);
      };
      if (document.documentElement.hasAttribute("data-preloader-skip")) build();
      else document.addEventListener(INTRO_DONE, build, { once: true });
      return () => {
        document.removeEventListener(INTRO_DONE, build);
        window.clearTimeout(settle);
        tl?.scrollTrigger?.kill();
        tl?.kill();
        layer.dataset.shown = "true";
        layer.style.removeProperty("--inv");
        if (focused) focus(null);
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
