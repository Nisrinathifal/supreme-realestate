"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { ease, gsap, MQ, setupGsap } from "@/lib/motion";

const WIDE = "(min-width: 981px)";
const DOCK = 34; // vw left beside the docked frame for a chapter (AboutStory.module.css --dock)
const STEP = 1.6; // timeline units per chapter

/**
 * The About camera run (after illoca.unseen.co). Before the pin the title's words rise over the wide frame. Pinned:
 * the title lifts away as the frame opens to the full view; then for each chapter the frame docks to one side (by
 * turns), the camera re-centres on what stays visible and keeps pushing in slowly, and the chapter rises beside it;
 * the chapter leaves, the frame opens again and the next scene comes through without a cut (the kitchen during the
 * works turns into the finished kitchen). The frame stays under the bar throughout; at the end it fills the view and
 * darkens into the letter band, and the header turns light with it. Wide screens with motion only; the static layout covers everything else.
 */
export function AboutStoryMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest<HTMLElement>("[data-about-film]");
      const q = gsap.utils.selector(root);
      const stage = q<HTMLElement>("[data-film-stage]")[0];
      const head = q<HTMLElement>("[data-film-head]")[0];
      const frame = q<HTMLElement>("[data-film-frame]")[0];
      const camera = q<HTMLElement>("[data-film-camera]")[0];
      const dusk = q<HTMLElement>("[data-film-dusk]")[0];
      const scenes = q<HTMLElement>("[data-film-scene]");
      const chapters = q<HTMLElement>("[data-film-chapter]");
      const words = q<HTMLElement>("[data-film-word]");
      if (!section || !stage || !head || !frame || !camera || !dusk || scenes.length < 2) return;
      const docEl = document.documentElement;
      const cssPx = (name: string, fallback: number) => parseFloat(getComputedStyle(docEl).getPropertyValue(name)) || fallback;
      const header = (dark: boolean) => document.dispatchEvent(new CustomEvent(HEADER_THEME, { detail: { key: "about", dark } }));
      const mm = gsap.matchMedia();

      mm.add(`${MQ.full} and ${WIDE}`, () => {
        section.setAttribute("data-live", "");
        // The wide frame under the title, in px of the pinned view
        const heroClip = () => {
          const top = head.offsetTop + head.offsetHeight + 40;
          const side = Math.round(window.innerWidth * 0.06);
          return `inset(${top}px ${side}px ${Math.round(window.innerHeight * 0.05)}px ${side}px)`;
        };
        // The frame stays under the bar (as in the reference), so the header always sits on Paper; only the end fills the view
        const bar = () => Math.round(cssPx("--header-h", 64) + cssPx("--s-3", 12));
        const full = () => `inset(${bar()}px 0px 0px 0px)`;
        const whole = "inset(0px 0px 0px 0px)";
        const dockClip = (left: boolean) => () => {
          const w = Math.round((window.innerWidth * DOCK) / 100);
          return left ? `inset(${bar()}px 0px 0px ${w}px)` : `inset(${bar()}px ${w}px 0px 0px)`;
        };

        gsap.set(words, { yPercent: 110 });
        gsap.set(frame, { clipPath: heroClip });
        gsap.set(scenes.slice(1), { opacity: 0 });
        gsap.set(scenes, { scale: 1.04, transformOrigin: "50% 50%" });
        gsap.set(chapters, { opacity: 0, y: 40 });
        gsap.set(dusk, { opacity: 0 });

        // Arrival: the promise rises in over the wide frame
        const arrive = gsap.to(words, {
          yPercent: 0,
          ease: ease.out,
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 80%", end: "top 15%", scrub: 0.8, invalidateOnRefresh: true },
        });

        const n = chapters.length;
        const outro = 1 + n * STEP;
        const total = outro + 1.2;
        let dark = false;
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * total * 0.55}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: () => {
              // light header text once the end has filled the view and darkens into the letter band
              const d = tl.time() > outro + 0.5;
              if (d !== dark) header((dark = d));
            },
            onLeaveBack: () => dark && header((dark = false)),
          },
        });

        // The title lifts away, the frame opens to the full view
        tl.to(head, { y: () => -window.innerHeight * 0.3, opacity: 0, duration: 0.7, ease: "power2.in" }, 0.1).to(frame, { clipPath: full, duration: 0.9 }, 0.1);

        chapters.forEach((ch, i) => {
          const t = 1 + i * STEP;
          const left = i % 2 === 0; // the chapter on the left, the frame docked right
          const scene = scenes[Math.min(i, scenes.length - 1)];
          // the camera keeps pushing in on the scene of this chapter
          tl.to(scene, { scale: 1.14, duration: STEP + 0.6, ease: "none" }, t - 0.4);
          tl.to(frame, { clipPath: dockClip(left), duration: 0.5 }, t)
            .to(camera, { x: () => (window.innerWidth * DOCK) / 200 * (left ? 1 : -1), duration: 0.5 }, t)
            .to(ch, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t + 0.3)
            .to(ch, { opacity: 0, y: -30, duration: 0.3, ease: "power2.in" }, t + 1.15)
            .to(frame, { clipPath: full, duration: 0.45 }, t + 1.2)
            .to(camera, { x: 0, duration: 0.45 }, t + 1.2);
          const next = scenes[i + 1];
          if (next) tl.to(next, { opacity: 1, duration: 0.4, ease: "none" }, t + 1.25);
        });

        // The end: the full view darkens into the letter band below
        tl.to(frame, { clipPath: whole, duration: 0.5 }, outro + 0.1).to(dusk, { opacity: 1, duration: 0.7, ease: "none" }, outro + 0.3).to({}, { duration: 0.2 }, total - 0.2);

        return () => {
          arrive.scrollTrigger?.kill();
          arrive.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          if (dark) header(false);
          section.removeAttribute("data-live");
          gsap.set([...words, head, frame, camera, dusk, ...scenes, ...chapters], { clearProps: "transform,opacity,clipPath" });
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-film-motion>
      {children}
    </div>
  );
}
