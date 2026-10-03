"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/** The stack at rest: a tiny offset per board, so it reads as paper on paper. */
const REST = [
  { x: 0, y: 0, r: 0 },
  { x: 6, y: 7, r: 1 },
  { x: -6, y: 13, r: -1 },
  { x: 9, y: 18, r: 1.2 },
  { x: -8, y: 24, r: -1.2 },
];
/** Where each board goes as it is dealt away (shares of the viewport) and how it turns. */
const EXIT = [
  { x: -0.62, y: -0.42, r: -12 },
  { x: 0.62, y: -0.4, r: 10 },
  { x: -0.6, y: 0.44, r: -9 },
  { x: 0.6, y: 0.42, r: 9 },
  { x: -0.56, y: -0.38, r: -7 },
];
/** The final composition around the headline (shares of the viewport), desktop and phone. */
const FINAL = {
  desktop: { scale: 0.34, at: [{ x: -0.3, y: -0.27, r: -4 }, { x: 0.3, y: -0.27, r: 3 }, { x: -0.31, y: 0.27, r: 3 }, { x: 0.31, y: 0.27, r: -3 }, { x: 0, y: -0.36, r: 1 }] },
  phone: { scale: 0.4, at: [{ x: -0.24, y: -0.3, r: -4 }, { x: 0.24, y: -0.3, r: 3 }, { x: -0.24, y: 0.3, r: 3 }, { x: 0.24, y: 0.3, r: -3 }, { x: 0, y: -0.4, r: 1 }] },
};
const HOLD = 0.12; // share of the scroll the stack rests before the first board goes
const DEAL = 0.16; // share per board

/**
 * One scrubbed timeline over the tall section (the stage is CSS sticky, so no GSAP pin): the boards rest as a stack
 * with tiny offsets; after a short hold the top board lifts away (up and to one side, turning, tipping back a touch)
 * and the next one is there beneath it; then that one goes, and so on, never together; in the last stretch all five
 * settle, small, around the headline. Phones deal shorter distances. Start states live here; reduced motion and
 * no-JS keep the plain list (the section is only tall and sticky once this runs).
 */
export function WorkMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest("[data-work]") as HTMLElement | null;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const q = gsap.utils.selector(root);
        const cards = q<HTMLElement>("[data-work-card]");
        if (!section || cards.length < 2) return;
        const phone = !window.matchMedia(MQ.desktop).matches;
        const reach = phone ? { x: 0.7, y: 0.55, r: 0.55 } : { x: 1, y: 1, r: 1 };
        const final = phone ? FINAL.phone : FINAL.desktop;
        const vw = () => window.innerWidth;
        const vh = () => window.innerHeight;

        section.setAttribute("data-stack", "");
        cards.forEach((card, i) => {
          const r = REST[i % REST.length];
          gsap.set(card, { x: r.x, y: r.y, rotation: r.r, rotationX: 0, scale: 1, transformPerspective: 1200, force3D: true });
        });

        // The shared band tone (set to Sky mist by the intro) fades back to white in the room above the stage
        const tokens = getComputedStyle(document.documentElement);
        const tone = gsap.to(document.body, {
          "--band-tone": tokens.getPropertyValue("--surface").trim(),
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: section, start: "top 70%", end: "top 10%", scrub: true, invalidateOnRefresh: true },
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true },
        });
        // Dealt one by one: each board leaves in its own stretch of the scroll
        cards.forEach((card, i) => {
          const e = EXIT[i % EXIT.length];
          tl.to(card, { x: () => e.x * reach.x * vw(), y: () => e.y * reach.y * vh(), rotation: e.r * reach.r, rotationX: -10, scale: 0.98, duration: DEAL }, HOLD + i * DEAL);
        });
        // The composition: the five settle around the headline together
        const settleAt = HOLD + cards.length * DEAL;
        cards.forEach((card, i) => {
          const f = final.at[i % final.at.length];
          tl.to(card, { x: () => f.x * vw(), y: () => f.y * vh(), rotation: f.r, rotationX: 0, scale: final.scale, duration: 1 - settleAt, ease: "power1.inOut" }, settleAt);
        });

        return () => {
          tone.scrollTrigger?.kill();
          tone.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          section.removeAttribute("data-stack");
          gsap.set(cards, { clearProps: "transform" }); // not "all": the cards carry an inline z-index
          ScrollTrigger.refresh();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-work-motion>
      {children}
    </div>
  );
}
