"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const REVOLUTION = 90; // seconds for one turn of the ring: slow (REFERENCE §9)

/**
 * The ring turns: every mascot moves along the ellipse the CSS placed it on (one ticker, positions from the stage
 * size, so the ring follows a resize). Each mascot breathes a little, and on a fine pointer tilts towards the cursor
 * (a perspective transform on its own layer) and settles back. The line and the mascots arrive once when the band
 * comes into view. Start states live here; reduced motion keeps the still ring from the CSS.
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
        const words = q<HTMLElement>("[data-orbit-word]");
        if (!section || !stage || !items.length) return;

        gsap.set(inners, { scale: 0 });
        gsap.set(words, { yPercent: 110 });

        // Arrival, once
        const arrive = ScrollTrigger.create({
          trigger: section,
          start: "top 70%",
          once: true,
          onEnter: () => {
            gsap.to(words, { yPercent: 0, duration: 0.9, ease: ease.out, stagger: 0.08 });
            gsap.to(inners, { scale: 1, duration: 1.1, ease: ease.out, stagger: { each: 0.07, from: "random" }, delay: 0.1 });
          },
        });

        // Breathing: a slow vertical drift per mascot, out of phase
        const breathe = inners.map((el, i) =>
          gsap.to(el, { y: 10, duration: 3.4 + (i % 3) * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -i * 0.9 }),
        );

        // The ring turns: positions from the angle in the markup and the stage size
        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        let t = 0;
        let rx = stage.clientWidth * 0.39;
        let ry = stage.clientHeight * 0.37;
        const measure = () => {
          rx = stage.clientWidth * 0.39;
          ry = stage.clientHeight * 0.37;
        };
        const tick = (_time: number, dt: number) => {
          t += dt / 1000;
          const turn = (t / REVOLUTION) * Math.PI * 2;
          items.forEach((el, i) => {
            const { a, k } = base[i];
            gsap.set(el, { x: (Math.cos(a + turn) - Math.cos(a)) * rx * k, y: (Math.sin(a + turn) - Math.sin(a)) * ry * k });
          });
        };
        const visible = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
          onRefresh: measure,
        });
        if (visible.isActive) gsap.ticker.add(tick);

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
              const px = (e.clientX - r.left) / r.width - 0.5;
              const py = (e.clientY - r.top) / r.height - 0.5;
              rx(-py * 22);
              ry(px * 22);
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
          gsap.ticker.remove(tick);
          visible.kill();
          arrive.kill();
          breathe.forEach((tw) => tw.kill());
          offs.forEach((off) => off());
          gsap.set([items, inners, words, q("[data-orbit-tilt]")], { clearProps: "transform" }); // never "all": the items carry React inline positions
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
