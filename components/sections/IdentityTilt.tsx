"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, MQ, setupGsap } from "@/lib/motion";

const TILT_X = 12; // degrees, top–bottom
const TILT_Y = 16; // degrees, left–right

/**
 * Turns the identity card towards the pointer (owner, 2026-10-07: a 3D card the cursor can handle; an exception to
 * REFERENCE-MOTION's "no tilt", noted in DESIGN). Fine pointers with motion on only. The card follows the pointer
 * with a soft lag, its sheen and its shadow move with it, and when the pointer leaves it settles back with a small
 * spring. Touch, reduced motion and no-JS: a flat card.
 */
export function IdentityTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const stage = scope.current!;
      const card = stage.querySelector<HTMLElement>("[data-id-card]");
      const shadow = stage.querySelector<HTMLElement>("[data-id-shadow]");
      if (!card) return;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.full} and (hover: hover) and (pointer: fine)`, () => {
        gsap.set(card, { transformPerspective: 1400, transformStyle: "preserve-3d" });
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
        const sx = shadow ? gsap.quickTo(shadow, "x", { duration: 0.6, ease: "power3.out" }) : null;
        const sy = shadow ? gsap.quickTo(shadow, "y", { duration: 0.6, ease: "power3.out" }) : null;

        const move = (e: PointerEvent) => {
          const b = card.getBoundingClientRect();
          const nx = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)) - 0.5;
          const ny = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) - 0.5;
          rx(-ny * TILT_X * 2);
          ry(nx * TILT_Y * 2);
          sx?.(-nx * 36);
          sy?.(-ny * 20 + 12);
          card.style.setProperty("--mx", `${(nx + 0.5) * 100}%`);
          card.style.setProperty("--my", `${(ny + 0.5) * 100}%`);
          card.setAttribute("data-lit", "");
        };
        const leave = () => {
          gsap.to(card, { rotationX: 0, rotationY: 0, duration: 1.1, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
          if (shadow) gsap.to(shadow, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
          card.removeAttribute("data-lit");
        };
        stage.addEventListener("pointermove", move);
        stage.addEventListener("pointerleave", leave);
        return () => {
          stage.removeEventListener("pointermove", move);
          stage.removeEventListener("pointerleave", leave);
          card.removeAttribute("data-lit");
          card.style.removeProperty("--mx");
          card.style.removeProperty("--my");
          gsap.set(card, { clearProps: "transform,transformStyle" });
          if (shadow) gsap.set(shadow, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={className} data-id-stage>
      {children}
    </div>
  );
}
