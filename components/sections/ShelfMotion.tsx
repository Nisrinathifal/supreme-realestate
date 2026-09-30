"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Icons fly from the sentence into the shelf, scrubbed by scroll as the shelf comes into view (no pin: the page
 * simply scrolls on). Start states are set here: the shelf copies of the icons are hidden and the inline icons
 * visible; each inline icon then travels (x, y, scale) onto its compartment and hands over to the shelf copy.
 * Under prefers-reduced-motion nothing runs and both the sentence icons and the filled shelf are shown.
 */
export function ShelfMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const q = gsap.utils.selector(root);
        const rack = q<HTMLElement>("[data-shelf-rack]")[0];
        const icons = q<HTMLElement>("[data-shelf-icon]");
        const targets = q<HTMLElement>("[data-shelf-target]");
        if (!rack || !icons.length) return;
        const targetFor = (el: HTMLElement) => targets.find((t) => t.dataset.shelfTarget === el.dataset.shelfIcon) ?? null;

        gsap.set(targets, { opacity: 0 });
        gsap.set(icons, { transformOrigin: "0 0", zIndex: 2 });

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: { trigger: rack, start: "top 95%", end: "top 30%", scrub: 1, invalidateOnRefresh: true },
        });
        icons.forEach((icon, i) => {
          const target = targetFor(icon);
          if (!target) return;
          // Function-based values: measured again on every refresh (fonts, resize)
          const dx = () => {
            const a = icon.getBoundingClientRect();
            const b = target.getBoundingClientRect();
            return b.left - a.left;
          };
          const dy = () => {
            const a = icon.getBoundingClientRect();
            const b = target.getBoundingClientRect();
            return b.top - a.top;
          };
          const scale = () => target.getBoundingClientRect().width / icon.getBoundingClientRect().width;
          const at = i * 0.12;
          tl.to(icon, { x: dx, y: dy, scale, duration: 0.55 }, at)
            .set(target, { opacity: 1 }, at + 0.55)
            .set(icon, { opacity: 0 }, at + 0.55);
        });

        return () => {
          gsap.set(targets, { clearProps: "opacity" });
          gsap.set(icons, { clearProps: "all" });
          ScrollTrigger.refresh();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-shelf-motion>
      {children}
    </div>
  );
}
