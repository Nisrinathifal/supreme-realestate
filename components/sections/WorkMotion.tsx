"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Work cards: the stacking is CSS (each case sticks, the next slides over it). One scrubbed timeline over the list
 * adds a slow parallax to every cover during its time on screen and lets a card's copy and detail photographs rise
 * in while that card slides in. The first card's copy rises once the list reaches the viewport. Start states live
 * here, so reduced motion and no-JS show the finished cards.
 */
export function WorkMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const list = root.querySelector<HTMLElement>("[data-work-cases]");
        const items = Array.from(root.querySelectorAll<HTMLElement>("[data-work-case]"));
        if (!list || items.length < 2) return;
        const n = items.length;
        // The list scrolls (n − 1) card pitches while the cards stack: card i arrives at progress i / (n − 1)
        const arrive = (i: number) => i / (n - 1);
        const span = 1 / (n - 1);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: list, start: "top top", end: "bottom bottom", scrub: 0.6 },
        });
        items.forEach((item, i) => {
          const cover = item.querySelector<HTMLElement>("[data-work-cover]");
          const copy = item.querySelector<HTMLElement>("[data-work-copy]");
          const details = Array.from(item.querySelectorAll<HTMLElement>("[data-work-details] > *"));
          const parts = [copy, ...details].filter(Boolean) as HTMLElement[];
          // Parallax over the card's life: from one pitch before it arrives until one pitch after
          if (cover) {
            const from = Math.max(0, arrive(i) - span), to = Math.min(1, arrive(i) + span);
            tl.fromTo(cover, { yPercent: -6 }, { yPercent: 6, duration: to - from }, from);
          }
          if (i === 0) {
            gsap.set(parts, { autoAlpha: 0, y: 28 });
            ScrollTrigger.create({
              trigger: list,
              start: "top 70%",
              once: true,
              onEnter: () => gsap.to(parts, { autoAlpha: 1, y: 0, duration: 0.9, ease: ease.out, stagger: 0.08 }),
            });
          } else {
            // Rises in during the last stretch of the card's slide-in
            tl.fromTo(parts, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: span * 0.35, stagger: span * 0.04, ease: ease.out }, arrive(i) - span * 0.4);
          }
        });
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
