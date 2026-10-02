"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";
import { WorkCompare } from "./WorkCompare";
import styles from "./WorkDeck.module.css";

type Item = { index: string; title: string; href: string; after: ImageAsset; before: ImageAsset };
type Labels = { of: string; total: string; open: string; close: string; compare: { before: string; after: string; label: string } };

/**
 * Deck of case cards after the reference recording: the cards sit stacked, each one a title strip over its finished
 * photograph, the later cards lower and in front. Hovering lifts a card; opening one (click, Enter) lets it fill the
 * stage and reveals the before/after comparison; hovering the open card shows the link to the case. Cards slide up
 * into the deck when the section comes into view (start states set here; reduced motion and no-JS show the deck).
 */
export function WorkDeck({ items, lang, labels }: { items: Item[]; lang: Lang; labels: Labels }) {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const open = (i: number | null) => {
    // An opening card must not carry the entrance tween's inline styles
    const cards = stage.current?.querySelectorAll<HTMLElement>("[data-deck-card]");
    if (cards) { gsap.killTweensOf(cards); gsap.set(cards, { clearProps: "all" }); }
    setActive(i);
  };

  useGSAP(
    () => {
      setupGsap();
      const root = stage.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const cards = root.querySelectorAll<HTMLElement>("[data-deck-card]");
        gsap.set(cards, { yPercent: 120, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: root,
          start: "top 75%",
          once: true,
          // Once in, every inline value goes, so the stylesheet's states (hover, open, behind) take over
          onEnter: () => gsap.to(cards, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: ease.out, stagger: 0.14, onComplete: () => gsap.set(cards, { clearProps: "all" }) }),
        });
      });
    },
    { scope: stage },
  );

  // Escape closes the open card
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div ref={stage} className={styles.stage} data-open={active !== null ? "true" : "false"}>
      {items.map((item, i) => {
        const state = active === null ? "idle" : active === i ? "open" : "behind";
        return (
          <article
            key={item.index}
            className={styles.card}
            style={{ "--i": i } as React.CSSProperties}
            data-deck-card
            data-state={state}
            aria-labelledby={`deck-${i}-title`}
          >
            <button type="button" className={styles.head} aria-expanded={state === "open"} onClick={() => open(state === "open" ? null : i)}>
              <span className={`t-micro ${styles.index}`}>
                {item.index} {labels.of} {labels.total}
              </span>
              <span id={`deck-${i}-title`} className={styles.title}>
                {item.title}
              </span>
            </button>
            <div className={styles.media}>
              <div className={styles.after}>
                <MediaFrame image={item.after} ratio="fill" lang={lang} radius="none" sizes="100vw" />
              </div>
              {state === "open" ? (
                <div className={styles.compare}>
                  <WorkCompare before={item.before} after={item.after} lang={lang} labels={labels.compare} />
                </div>
              ) : null}
            </div>
            {state === "open" ? (
              <>
                <Link href={item.href} className={styles.detail}>
                  {labels.open} <span aria-hidden="true">→</span>
                </Link>
                <button type="button" className={styles.close} onClick={() => open(null)} aria-label={labels.close}>
                  <X size={18} weight="bold" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
