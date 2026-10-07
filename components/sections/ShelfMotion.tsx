"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * The wall's columns stand tall, up through the projects band's empty foot, and rise one at a time to their full
 * height once that band has faded to Paper (owner, 2026-10-07). The icons fly from the sentence into the shelf, scrubbed by scroll as the shelf comes into view (no pin: the page
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
        const section = root.closest<HTMLElement>("[data-shelf]");
        const columns = section?.querySelector<SVGSVGElement>("[data-shelf-columns]");
        if (!section || !columns) return;
        // Every band, both registers, left to right by its place on the wall; they wait for the band above to have
        // faded to Paper (WorkMotion), then rise one at a time to their full height
        const bands = Array.from(columns.querySelectorAll<SVGRectElement>("rect")).sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")));
        gsap.set(bands, { scaleY: 0, transformOrigin: "50% 100%" });
        const rise = gsap.to(bands, {
          scaleY: 1,
          ease: "power2.out",
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 112%", end: "top 30%", scrub: 0.8, invalidateOnRefresh: true },
        });
        return () => {
          rise.scrollTrigger?.kill();
          rise.kill();
          gsap.set(bands, { clearProps: "transform" });
        };
      });

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
          scrollTrigger: { trigger: rack, start: "top 100%", end: "top 15%", scrub: 1.6, invalidateOnRefresh: true },
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
          // Each icon grows while it travels (scale runs with the move); the moves overlap for one calm flow
          const at = i * 0.1;
          tl.to(icon, { x: dx, y: dy, scale, duration: 0.7, ease: "power2.inOut" }, at)
            .set(target, { opacity: 1 }, at + 0.7)
            .set(icon, { opacity: 0 }, at + 0.7);
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
