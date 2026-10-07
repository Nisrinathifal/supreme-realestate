"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Choreography after the reference, on every screen size (phones too, with narrower panels): the headline lines rise in as the band comes up; the band is then pinned for ~5 viewports;
 * the strip of panels (laid out as one row by `data-row`) starts tiny at the bottom right, grows to the full
 * viewport while the headline fades, then slides sideways so panels 02 and 03 pass through, and holds.
 * All start states are set here; without this (reduced motion, no JS) the CSS stacks everything.
 */
export function StepsMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const section = root.closest("[data-steps]") as HTMLElement | null;
        const q = gsap.utils.selector(root);
        const stage = q<HTMLElement>("[data-steps-stage]")[0];
        const lines = q<HTMLElement>("[data-steps-line]");
        const strip = q<HTMLElement>("[data-steps-strip]")[0];
        const sketches = q<HTMLElement>("[data-steps-sketch]");
        if (!section || !stage || !strip) return;

        strip.setAttribute("data-row", "");
        const travel = () => Math.max(0, strip.scrollWidth - window.innerWidth);
        // The band after this one slides up over the held strip (reference): pull it up one viewport while pinned
        const next = section.nextElementSibling as HTMLElement | null;
        if (next?.hasAttribute("data-overlap")) gsap.set(next, { marginTop: () => -window.innerHeight, zIndex: 2, position: "relative" });

        gsap.set(lines, { yPercent: 110 });
        gsap.set(sketches, { opacity: 0, y: 24 });
        gsap.set(strip, { transformOrigin: "100% 100%", scale: 0.22, xPercent: 18, yPercent: 14, opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: { trigger: section, start: "top top", end: "+=580%", pin: true, scrub: 1.2, anticipatePin: 1, invalidateOnRefresh: true },
        });
        // The headline rises while the band comes up out of the wall's dusk, so the pinned band never opens empty;
        // the pin then holds it a moment to be read
        const intro = gsap
          .timeline({ scrollTrigger: { trigger: section, start: "top 75%", end: "top 5%", scrub: 0.8, invalidateOnRefresh: true } })
          .to(lines, { yPercent: 0, duration: 0.6, ease: ease.out, stagger: 0.15 }, 0)
          .to(sketches, { opacity: 0.9, y: 0, duration: 0.6, ease: ease.out }, 0.1);
        tl.to({}, { duration: 0.2 }, 0)
          .to(strip, { opacity: 1, duration: 0.05, ease: "none" }, 0.2)
          .to(strip, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.3, ease: ease.precise }, 0.2)
          .to(stage, { opacity: 0, duration: 0.14 }, 0.3)
          .to(strip, { x: () => -travel(), duration: 0.34, ease: "none" }, 0.52)
          .to({}, { duration: 0.14 }); // held while the next band covers it

        return () => {
          intro.scrollTrigger?.kill();
          intro.kill();
          strip.removeAttribute("data-row");
          gsap.set([lines, sketches, strip, stage], { clearProps: "all" });
          if (next) gsap.set(next, { clearProps: "marginTop,zIndex,position" });
          ScrollTrigger.refresh();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-steps-motion>
      {children}
    </div>
  );
}
