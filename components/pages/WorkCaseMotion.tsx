"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, MQ, setupGsap } from "@/lib/motion";

/**
 * Case page: each chapter statement reveals word by word from the statement grey to ink while it scrolls through the
 * middle of the viewport (scrubbed), after the reference. Start colour is set here, so reduced motion and no-JS
 * read the statements in ink.
 */
export function WorkCaseMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const from = getComputedStyle(root).getPropertyValue("--reveal-from").trim();
        const ink = getComputedStyle(root).getPropertyValue("--ink").trim();
        root.querySelectorAll<HTMLElement>("[data-work-statement]").forEach((st) => {
          const words = st.querySelectorAll<HTMLElement>("span");
          gsap.set(words, { color: from });
          gsap.to(words, {
            color: ink,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 45%", scrub: 0.4 },
          });
        });
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
