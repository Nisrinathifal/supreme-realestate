"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Columns } from "@/components/brand/Columns";
import { gsap, MQ, setupGsap } from "@/lib/motion";
import styles from "./Work.module.css";

/**
 * The shelf's columns, already in the projects band's foot (owner, 2026-10-07: no empty gap, no sectioning). They wait
 * until the band has faded to Paper, then rise one at a time, left to right, each to its full height; the same
 * column in the wall below rises with it, so the two read as one column running down into the shelf.
 * Reduced motion and no-JS: standing.
 */
export function WorkColumns() {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const band = root.closest<HTMLElement>("[data-work]");
      const next = band?.nextElementSibling as HTMLElement | null;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        if (!next) return;
        const byX = (list: NodeListOf<SVGRectElement> | undefined) => Array.from(list ?? []).sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")));
        const own = byX(root.querySelectorAll<SVGRectElement>("rect"));
        const wall = byX(next.querySelector("[data-shelf-columns]")?.querySelectorAll<SVGRectElement>("rect"));
        const all = [...own, ...wall];
        gsap.set(all, { scaleY: 0, transformOrigin: "50% 100%" });
        // The band is all but Paper a little before the wall reaches the foot of the view (WorkMotion's fade): from there
        const rise = gsap.timeline({
          defaults: { ease: "power2.out", duration: 0.5 },
          scrollTrigger: { trigger: next, start: "top 112%", end: "top 30%", scrub: 0.8, invalidateOnRefresh: true },
        });
        rise.to(own, { scaleY: 1, stagger: 0.1 }, 0);
        if (wall.length) rise.to(wall, { scaleY: 1, stagger: 0.1 }, 0);
        return () => {
          rise.scrollTrigger?.kill();
          rise.kill();
          gsap.set(all, { clearProps: "transform" });
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
