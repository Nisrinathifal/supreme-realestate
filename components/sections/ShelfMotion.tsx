"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * The wall's columns, in two registers that break between the statement and the shelf (owner, 2026-10-07), rise one
 * at a time once the band above has faded to Paper, behind the statement, which comes straight in. The icons fly from the sentence into the shelf, scrubbed by scroll as the shelf comes into view (no pin: the page
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

      // The two registers of columns (as in the reference) break between the statement and the shelf: the tall upper
      // register runs down from above the band to there, the offset lower one, with its rounded tops, starts there.
      // Measured, so the break sits between the two on every screen (also without motion).
      const wall = root.closest<HTMLElement>("[data-shelf]");
      const svg = wall?.querySelector<SVGSVGElement>("[data-shelf-columns]");
      const statement = root.querySelector<HTMLElement>("[data-shelf-statement]");
      const rackEl = root.querySelector<HTMLElement>("[data-shelf-rack]");
      const place = () => {
        if (!svg || !statement || !rackEl) return;
        const box = svg.getBoundingClientRect();
        if (!box.height) return;
        const at = (statement.getBoundingClientRect().bottom + rackEl.getBoundingClientRect().top) / 2 - box.top;
        const b = Math.max(0, Math.min(900, (at / box.height) * 900)); // in the svg's own units (viewBox height 900)
        svg.querySelectorAll<SVGRectElement>('rect[data-register="upper"]').forEach((r) => r.setAttribute("height", String(b + 6)));
        svg.querySelectorAll<SVGRectElement>('rect[data-register="lower"]').forEach((r) => {
          r.setAttribute("y", String(b));
          r.setAttribute("height", String(900 - b));
        });
        gsap.set(svg.querySelectorAll("rect"), { transformOrigin: "50% 100%" }); // the rise grows each from its new foot
      };
      place();
      const ro = new ResizeObserver(place);
      if (wall) ro.observe(wall);
      if (svg) ro.observe(svg);

      mm.add(MQ.full, () => {
        const section = root.closest<HTMLElement>("[data-shelf]");
        const columns = section?.querySelector<SVGSVGElement>("[data-shelf-columns]");
        if (!section || !columns) return;
        // Every band, both registers, left to right by its place on the wall (the registers interleave); they wait for
        // the band above to have faded to Paper (WorkMotion), then rise one at a time to their full height
        const bands = Array.from(columns.querySelectorAll<SVGRectElement>("rect")).sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")));
        gsap.set(bands, { scaleY: 0, transformOrigin: "50% 100%" });
        const rise = gsap.to(bands, {
          scaleY: 1,
          ease: "power2.out",
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 80%", end: "top 15%", scrub: 0.8, invalidateOnRefresh: true }, // once the daylight has risen
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
      return () => {
        ro.disconnect();
        mm.revert();
      };
    },
    { scope },
  );

  return (
    <div ref={scope} data-shelf-motion>
      {children}
    </div>
  );
}
