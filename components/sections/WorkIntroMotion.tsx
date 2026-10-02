"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const DRIFT = 26; // degrees every mascot travels along the ring over the pinned scroll
const PIN = 1.5; // viewports the band stays pinned

/**
 * One scrubbed timeline over a pinned band, all transforms. The headline comes up one line per scroll step (each
 * line rises out of its own clip). Meanwhile every mascot drifts the same way along the ring: the ones in front move
 * outward and grow, the ones behind the headline come forward from a smaller, dimmer start (they reveal themselves).
 * When the pin ends the page scrolls on into the projects; nothing covers anything. On a fine pointer a mascot tilts
 * towards the cursor. Start states live here; reduced motion: no pin, no scrub, the full headline and the still ring.
 */
export function WorkIntroMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest("[data-work-intro]") as HTMLElement | null;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const q = gsap.utils.selector(root);
        const stage = q<HTMLElement>("[data-orbit]")[0];
        const items = q<HTMLElement>("[data-orbit-item]");
        const inners = q<HTMLElement>("[data-orbit-inner]");
        const lines = q<HTMLElement>("[data-orbit-line]");
        if (!section || !stage || !items.length || !lines.length) return;

        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1, front: Number(el.dataset.front) === 1 }));
        // Where a mascot ends: further along the ring; in front also further out, behind a touch closer in
        const endX = (i: number) => {
          const { a, k, front } = base[i];
          const r = k * (front ? 1.4 : 1.02);
          const a1 = a + (DRIFT * Math.PI) / 180;
          return (Math.cos(a1) * r - Math.cos(a) * k) * stage.clientWidth * RX;
        };
        const endY = (i: number) => {
          const { a, k, front } = base[i];
          const r = k * (front ? 1.4 : 1.02);
          const a1 = a + (DRIFT * Math.PI) / 180;
          return (Math.sin(a1) * r - Math.sin(a) * k) * stage.clientHeight * RY;
        };

        // Start states: the lines below their clips, the mascots behind the headline small and dim
        gsap.set(lines, { yPercent: 110 });
        items.forEach((el, i) => {
          if (!base[i].front) gsap.set(inners[i], { scale: 0.72, opacity: 0.35 });
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${window.innerHeight * PIN}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        // One line per step: 0–.14, .22–.36, .44–.58 of the pinned scroll
        lines.forEach((line, i) => tl.to(line, { yPercent: 0, duration: 0.14, ease: ease.out }, i * 0.22));
        items.forEach((el, i) => {
          tl.to(el, { x: () => endX(i), y: () => endY(i), duration: 1 }, 0);
          if (base[i].front) tl.to(inners[i], { scale: 1.16, rotation: 5, duration: 1, ease: ease.inOut }, 0);
          else tl.to(inners[i], { scale: 1, opacity: 1, rotation: -3, duration: 0.6, ease: ease.inOut }, 0.1);
        });

        // Hover: the mascot leans towards the pointer, on devices with a fine pointer only
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const offs: (() => void)[] = [];
        if (fine) {
          q<HTMLElement>("[data-orbit-tilt]").forEach((el) => {
            gsap.set(el, { transformPerspective: 700 });
            const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: ease.out });
            const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: ease.out });
            const sc = gsap.quickTo(el, "scale", { duration: 0.6, ease: ease.out });
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              rx(-((e.clientY - r.top) / r.height - 0.5) * 22);
              ry(((e.clientX - r.left) / r.width - 0.5) * 22);
              sc(1.08);
            };
            const leave = () => {
              rx(0);
              ry(0);
              sc(1);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            offs.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
        }

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          offs.forEach((off) => off());
          // never clearProps "all": the items carry React inline positions
          gsap.set([items, inners, lines, q("[data-orbit-tilt]")], { clearProps: "transform,opacity" });
          ScrollTrigger.refresh();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-work-intro-motion style={{ display: "contents" }}>
      {children}
    </div>
  );
}
