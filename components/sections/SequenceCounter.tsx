"use client";

import { useEffect, useState } from "react";

/** Updates the "1 / 6" micro label for the ≤980px snap-scroller. Server renders the initial value. */
export function SequenceCounter({ scrollerId, total }: { scrollerId: string; total: number }) {
  const [i, setI] = useState(1);
  useEffect(() => {
    const scroller = document.getElementById(scrollerId);
    if (!scroller) return;
    const items = Array.from(scroller.querySelector("ul")?.children ?? []);
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setI(items.indexOf(best.target) + 1);
      },
      { root: scroller, threshold: [0.5, 0.75] },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scrollerId]);
  return <span aria-live="polite">{`${i} / ${total}`}</span>;
}
