"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ } from "@/lib/motion";
import { setupGsap } from "@/lib/motion";

/**
 * First-view rise (DESIGN §11 "Rise"): the copy block and then the cards, 32px → 0 with opacity, once.
 * Start states live here; without motion the band is simply there.
 */
export function SkyMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const q = gsap.utils.selector(root);
        const copy = q<HTMLElement>("[data-sky-copy]")[0];
        const cards = q<HTMLElement>("[data-sky-card]");
        const section = root.closest("[data-sky]") as HTMLElement | null;
        if (!copy || !section) return;
        const items = [...Array.from(copy.children), ...cards];
        gsap.fromTo(items, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease.out, stagger: 0.07, scrollTrigger: { trigger: section, start: "top 60%", once: true } });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-sky-motion>
      {children}
    </div>
  );
}
