"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, setupGsap } from "@/lib/motion";

/**
 * The About band's arrival, scrubbed and calm: the title's words rise out of their masks one after another, the lead
 * and the body follow, the interior opens from the bottom (a clip, with a slow settle of scale), and the principles
 * rise in turn. The band's foot gets the dusk into the steps band (About.module.css, [data-dusk]).
 * Start states are set here; reduced motion and no-JS show everything in place.
 */
export function AboutMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const section = root.closest<HTMLElement>("[data-about]");
        if (!section) return;
        const q = gsap.utils.selector(root);
        const words = q<HTMLElement>("[data-about-word]");
        const rise = q<HTMLElement>("[data-about-rise]");
        const media = q<HTMLElement>("[data-about-media]")[0];
        const picture = media?.querySelector<HTMLElement>("[data-media-inner]");
        const principles = q<HTMLElement>("[data-about-principle]");

        section.setAttribute("data-dusk", "");
        gsap.set(words, { yPercent: 110 });
        gsap.set(rise, { y: 28, opacity: 0 });
        if (media) gsap.set(media, { clipPath: "inset(100% 0% 0% 0%)" });
        if (picture) gsap.set(picture, { scale: 1.12 });
        gsap.set(principles, { y: 32, opacity: 0 });

        const text = gsap
          .timeline({ scrollTrigger: { trigger: section, start: "top 78%", end: "top 18%", scrub: 0.8, invalidateOnRefresh: true } })
          .to(words, { yPercent: 0, duration: 0.5, ease: ease.out, stagger: 0.08 }, 0)
          .to(rise, { y: 0, opacity: 1, duration: 0.5, ease: ease.out, stagger: 0.15 }, 0.3);
        if (media) text.to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: ease.inOut }, 0.1);
        if (picture) text.to(picture, { scale: 1, duration: 1, ease: ease.out }, 0.1);

        const list = gsap.to(principles, {
          y: 0,
          opacity: 1,
          ease: ease.out,
          stagger: 0.12,
          scrollTrigger: { trigger: principles[0] ?? section, start: "top 92%", end: "top 62%", scrub: 0.8, invalidateOnRefresh: true },
        });

        return () => {
          text.scrollTrigger?.kill();
          text.kill();
          list.scrollTrigger?.kill();
          list.kill();
          section.removeAttribute("data-dusk");
          gsap.set([...words, ...rise, ...principles], { clearProps: "transform,opacity" });
          if (media) gsap.set(media, { clearProps: "clipPath" });
          if (picture) gsap.set(picture, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-about-motion>
      {children}
    </div>
  );
}
