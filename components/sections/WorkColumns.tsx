"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Columns } from "@/components/brand/Columns";
import { gsap, MQ, setupGsap } from "@/lib/motion";
import styles from "./Work.module.css";

/**
 * The shelf's columns, already in the projects band's foot (owner, 2026-10-07: no empty gap, no sectioning): they
 * stand behind the last card and the band's fade to Paper, and run straight on into the wall below. Each rises full
 * height from the floor, left to right, over a short stretch of scroll, as soon as the foot comes into view.
 * Reduced motion and no-JS: standing.
 */
export function WorkColumns() {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const bands = Array.from(root.querySelectorAll<SVGRectElement>("rect")).sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")));
        gsap.set(bands, { scaleY: 0, transformOrigin: "50% 100%" });
        const rise = gsap.to(bands, {
          scaleY: 1,
          ease: "power2.out",
          stagger: 0.04,
          scrollTrigger: { trigger: root, start: "top 95%", end: "top 35%", scrub: 0.8, invalidateOnRefresh: true },
        });
        return () => {
          rise.scrollTrigger?.kill();
          rise.kill();
          gsap.set(bands, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope },
  );
  return (
    <div ref={scope} className={styles.columns} aria-hidden="true">
      <Columns tone="paper" />
    </div>
  );
}
