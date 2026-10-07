"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const WIDE = "(min-width: 981px)"; // the two-column story (AboutStory.module.css)

/**
 * The About story's motion. The title's words rise out of their masks. On wide screens the photograph is held
 * (CSS sticky) while the chapters pass: the chapter at the reading line is at full strength and its stop marked, and
 * the room renews under a seam from the works to the finished kitchen across the chapters, so the last chapter
 * lands on the delivered room. On phones the room renews as the photograph itself passes. The identity card is
 * handed over (it turns up from lying back) and its fields are written in one after another. Start states are set here; reduced motion and no-JS show the finished
 * room, every chapter in full and the register in place.
 */
export function AboutStoryMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest<HTMLElement>("[data-about-story]");
      if (!section) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      // The room: --wipe 0 (the works) to 100 (finished); the tag and the seam follow the phase
      const frame = q<HTMLElement>("[data-story-frame]")[0];
      const wipe = (trigger: gsap.DOMTarget, vars: ScrollTrigger.Vars) => {
        if (!frame) return null;
        const phase = () => {
          const v = Number(gsap.getProperty(frame, "--wipe"));
          frame.setAttribute("data-phase", v < 50 ? "before" : "after");
        };
        return gsap.fromTo(frame, { "--wipe": 0 }, { "--wipe": 100, ease: "none", immediateRender: true, onUpdate: phase, onStart: phase, scrollTrigger: { trigger, ...vars, scrub: 0.6, invalidateOnRefresh: true, onRefresh: phase } });
      };

      mm.add(MQ.full, () => {
        const words = q<HTMLElement>("[data-story-word]");
        gsap.set(words, { yPercent: 110 });
        const title = gsap.to(words, {
          yPercent: 0,
          ease: ease.out,
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 85%", end: "top 35%", scrub: 0.8, invalidateOnRefresh: true },
        });

        // The register: the identity card is handed over (it turns up from lying back), its fields are written in
        // one after another, then the rest follows
        const wrap = q<HTMLElement>("[data-register-card]")[0];
        const stage = wrap?.querySelector<HTMLElement>("[data-id-stage]") ?? null;
        const rows = wrap ? Array.from(wrap.querySelectorAll<HTMLElement>("[data-id-card] dl > div")) : [];
        const after = wrap ? Array.from(wrap.children).filter((el) => el !== stage) : [];
        if (stage) gsap.set(stage, { transformPerspective: 1200, transformOrigin: "50% 100%", rotationX: 38, y: 60, opacity: 0 });
        gsap.set(rows, { clipPath: "inset(0% 100% 0% 0%)" });
        gsap.set(after, { opacity: 0, y: 12 });
        const reg = wrap
          ? gsap
              .timeline({ scrollTrigger: { trigger: wrap, start: "top 90%", end: "top 35%", scrub: 0.8, invalidateOnRefresh: true } })
              .to(stage, { rotationX: 0, y: 0, opacity: 1, duration: 0.6, ease: ease.out }, 0)
              .to(rows, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: ease.inOut, stagger: 0.1 }, 0.35)
              .to(after, { opacity: 1, y: 0, duration: 0.3, ease: ease.out, stagger: 0.08 }, ">-0.1")
          : null;

        return () => {
          title.scrollTrigger?.kill();
          title.kill();
          reg?.scrollTrigger?.kill();
          reg?.kill();
          gsap.set([...words, ...rows, ...after], { clearProps: "transform,opacity,clipPath" });
          if (stage) gsap.set(stage, { clearProps: "transform,opacity" });
        };
      });

      mm.add(`${MQ.full} and ${WIDE}`, () => {
        const chapters = q<HTMLElement>("[data-story-chapter]");
        const stops = q<HTMLElement>("[data-story-stop]");
        if (!chapters.length) return;
        section.setAttribute("data-story-live", "");
        const activate = (i: number) => {
          chapters.forEach((ch, j) => ch.toggleAttribute("data-active", j === i));
          stops.forEach((st, j) => st.toggleAttribute("data-active", j === i));
        };
        activate(0);
        // The chapter crossing the reading line (just above the middle) is the one being read
        const reads = chapters.map((ch, i) =>
          ScrollTrigger.create({ trigger: ch, start: "top 58%", end: "bottom 58%", onToggle: (self) => self.isActive && activate(i), invalidateOnRefresh: true }),
        );
        // The room renews from the second chapter to the last, so the delivery is told over the finished room
        const room = wipe(chapters[1], { start: "top 58%", endTrigger: chapters[chapters.length - 1], end: "top 58%" });

        return () => {
          section.removeAttribute("data-story-live");
          chapters.forEach((ch) => ch.removeAttribute("data-active"));
          stops.forEach((st) => st.removeAttribute("data-active"));
          reads.forEach((t) => t.kill());
          room?.scrollTrigger?.kill();
          room?.kill();
          if (frame) {
            gsap.set(frame, { clearProps: "--wipe" });
            frame.removeAttribute("data-phase");
          }
        };
      });

      mm.add(`${MQ.full} and (max-width: 980px)`, () => {
        const room = frame ? wipe(frame, { start: "top 75%", end: "bottom 35%" }) : null;
        return () => {
          room?.scrollTrigger?.kill();
          room?.kill();
          if (frame) {
            gsap.set(frame, { clearProps: "--wipe" });
            frame.removeAttribute("data-phase");
          }
        };
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-about-story-motion>
      {children}
    </div>
  );
}
