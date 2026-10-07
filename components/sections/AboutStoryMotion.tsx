"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { ease, gsap, MQ, setupGsap } from "@/lib/motion";

const WIDE = "(min-width: 981px)";
const DOCK = 34; // vw left beside the docked frame for a chapter (AboutStory.module.css --dock)
const STEP = 2; // timeline units per chapter (glide, read, glide)

/**
 * The About camera run (after illoca.unseen.co). Before the pin the title's words rise over the wide frame. Pinned:
 * the title lifts away as the frame opens to the full view; then for each chapter the frame docks to one side (by
 * turns), the camera re-centres on what stays visible and keeps pushing in slowly, and the chapter rises beside it;
 * the chapter leaves, the frame opens again and the next scene comes through without a cut (the kitchen during the
 * works turns into the finished kitchen). The frame stays under the bar throughout; at the end the view darkens into
 * the letter band, and the header turns light with it. Transforms and opacity only (no clip-path), for a smooth run. Wide screens with motion only; the static layout covers everything else.
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
        // The wide frame under the title: the frame (which sits under the bar) set lower and a little smaller
        const bar = () => Math.round(cssPx("--header-h", 64) + cssPx("--s-3", 12));
        const heroY = () => head.offsetTop + head.offsetHeight + 40 - bar();
        const HERO_SCALE = 0.88;
        const dockX = () => Math.round((window.innerWidth * DOCK) / 100);

        gsap.set(words, { yPercent: 110 });
        gsap.set(frame, { y: heroY, scale: HERO_SCALE, transformOrigin: "50% 0%", force3D: true });
        gsap.set(scenes.slice(1), { opacity: 0 });
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
        tl.to(head, { y: () => -window.innerHeight * 0.3, opacity: 0, duration: 0.7, ease: "power2.in" }, 0.1).to(frame, { y: 0, scale: 1, duration: 0.9 }, 0.1);

        // One slow push of the camera over the whole run, so the zoom never steps back when a scene changes
        tl.fromTo(camera, { scale: 1 }, { scale: 1.16, duration: total, ease: "none" }, 0);

        chapters.forEach((ch, i) => {
          const t = 1 + i * STEP;
          const left = i % 2 === 0; // the chapter on the left, the frame docked right
          const side = left ? 1 : -1;
          // The frame glides straight from one side to the other in one move (through the middle), and the camera inside
          // it re-centres the scene; the next scene comes through during the glide
          tl.to(frame, { x: () => dockX() * side, duration: i === 0 ? 0.6 : 0.9, ease: "sine.inOut" }, i === 0 ? t : t - 0.25).to(
            camera,
            { x: () => (dockX() / 2) * -side, duration: i === 0 ? 0.6 : 0.9, ease: "sine.inOut" },
            i === 0 ? t : t - 0.25,
          );
          if (i > 0 && scenes[i]) tl.to(scenes[i], { opacity: 1, duration: 0.6, ease: "none" }, t - 0.15);
          tl.to(ch, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t + 0.45).to(ch, { opacity: 0, y: -30, duration: 0.3, ease: "power2.in" }, t + STEP - 0.55);
        });
        // After the last chapter the frame comes back to the middle
        tl.to(frame, { x: 0, duration: 0.6, ease: "sine.inOut" }, outro - 0.2).to(camera, { x: 0, duration: 0.6, ease: "sine.inOut" }, outro - 0.2);

        // The end: the full view darkens into the letter band below
        tl.to(dusk, { opacity: 1, duration: 0.8, ease: "none" }, outro + 0.2).to({}, { duration: 0.2 }, total - 0.2);

        return () => {
          arrive.scrollTrigger?.kill();
          arrive.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          if (dark) header(false);
          section.removeAttribute("data-live");
          gsap.set([...words, head, frame, camera, dusk, ...scenes, ...chapters], { clearProps: "transform,opacity" });
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
