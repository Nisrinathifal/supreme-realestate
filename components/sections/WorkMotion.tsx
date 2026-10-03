"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Arrival: the shared band tone fades from the intro's Sky mist to white and the heading, the first card and its
 * photographs come up and settle, scrubbed by the scroll. Desktop deck after the reference:
 * the deck is then pinned one viewport tall; the cards still to come wait as strips below the active card (each one a
 * little narrower), and each next card rises to the top and grows to full width over the current one while its
 * photographs slide in from the right and its note settles, scrubbed. On a fine pointer the card's pill follows the
 * pointer anywhere on the card and returns to the photographs when it leaves. Start states live here; without this the
 * CSS stacks the cards (phones) or lists them (reduced motion, no JS).
 */
export function WorkMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();

      mm.add(MQ.full, () => {
        const section = root.closest("[data-work]") as HTMLElement | null;
        const q = gsap.utils.selector(root);
        const heading = section?.querySelector<HTMLElement>("[data-work-heading]");
        const first = q<HTMLElement>("[data-work-card]")[0];
        if (!section || !heading || !first) return;
        const firstPhotos = first.querySelector<HTMLElement>("[data-work-photos]");
        // The shared band tone (--band-tone on body, set to Sky mist by the intro) fades back to white inside this
        // band's room above the heading, so the colour changes as the projects come in, with no seam
        const tokens = getComputedStyle(document.documentElement);
        const tone = gsap.to(document.body, {
          "--band-tone": tokens.getPropertyValue("--surface").trim(),
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: section, start: "top 70%", end: "top 10%", scrub: true, invalidateOnRefresh: true },
        });
        gsap.set(heading, { y: 56, opacity: 0 });
        gsap.set(first, { y: 96, scale: 0.94 });
        if (firstPhotos) gsap.set(firstPhotos, { xPercent: 10 });
        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: { trigger: section, start: "top 95%", end: "top 12%", scrub: 0.8, invalidateOnRefresh: true },
        });
        tl.to(heading, { y: 0, opacity: 1, duration: 0.6 }, 0)
          .to(first, { y: 0, scale: 1, duration: 0.8 }, 0.15)
          .to(firstPhotos, { xPercent: 0, duration: 0.7 }, 0.3);
        return () => {
          tone.scrollTrigger?.kill();
          tone.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          gsap.set([heading, first, firstPhotos], { clearProps: "transform,opacity" });
        };
      });

      mm.add(`${MQ.full} and ${MQ.desktop}`, () => {
        const q = gsap.utils.selector(root);
        const deck = q<HTMLElement>("[data-work-deck]")[0];
        const cards = q<HTMLElement>("[data-work-card]");
        const n = cards.length;
        if (!deck || n < 2) return;

        deck.setAttribute("data-deck", "");
        const peek = () => cssPx(deck, "--peek", 48);
        const top = () => cssPx(deck, "--stack-top", 88);
        // Where card i waits: its top edge one strip per card still behind it above the deck's foot
        const restY = (i: number) => deck.clientHeight - (n - i) * peek();
        const restScale = (i: number) => 1 - 0.028 * (n - i);

        gsap.set(cards, { transformPerspective: 1400, force3D: true });
        cards.forEach((card, i) => {
          if (i === 0) return;
          gsap.set(card, { y: () => restY(i), scale: () => restScale(i) });
          gsap.set(card.querySelector("[data-work-photos]"), { xPercent: 12 });
          gsap.set(card.querySelector("[data-work-note]"), { y: 24, opacity: 0 });
        });

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: deck,
            start: () => `top ${top()}`,
            end: () => `+=${(n - 1) * window.innerHeight * 0.85}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        cards.forEach((card, i) => {
          if (i === 0) return;
          // The card on top is lifted away like a sheet of paper: pivoting on its foot, its top tips back and
          // it rises out of the deck, above the next card, which comes up into its place meanwhile
          const prev = cards[i - 1];
          tl.set(prev, { zIndex: 50, transformOrigin: "50% 100%" }, i - 1)
            .to(prev, { y: () => -deck.clientHeight * 1.15, rotationX: 16, scale: 0.97, duration: 1, ease: "power1.in" }, i - 1)
            .to(card, { y: 0, scale: 1, duration: 1 }, i - 1)
            .to(card.querySelector("[data-work-photos]"), { xPercent: 0, duration: 0.6 }, i - 1 + 0.4)
            .to(card.querySelector("[data-work-note]"), { y: 0, opacity: 1, duration: 0.5 }, i - 1 + 0.5);
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          deck.removeAttribute("data-deck");
          gsap.set(cards, { clearProps: "transform,zIndex,transformOrigin" }); // not "all": the cards carry inline custom properties
          gsap.set(q("[data-work-photos], [data-work-note]"), { clearProps: "transform,opacity" });
          ScrollTrigger.refresh();
        };
      });

      mm.add(`${MQ.full} and (hover: hover) and (pointer: fine)`, () => {
        const q = gsap.utils.selector(root);
        const offs: (() => void)[] = [];
        q<HTMLElement>("[data-work-card]").forEach((card) => {
          const gallery = card.querySelector<HTMLElement>("[data-work-gallery]");
          const pill = card.querySelector<HTMLElement>("[data-work-pill]");
          if (!gallery || !pill) return;
          // The pill rests in the middle of the photographs; the offset is measured from there
          const x = gsap.quickTo(pill, "x", { duration: 0.5, ease: ease.out });
          const y = gsap.quickTo(pill, "y", { duration: 0.5, ease: ease.out });
          const move = (e: PointerEvent) => {
            const r = gallery.getBoundingClientRect();
            x(e.clientX - r.left - r.width / 2);
            y(e.clientY - r.top - r.height / 2);
          };
          const leave = () => {
            x(0);
            y(0);
          };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          offs.push(() => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
            gsap.set(pill, { clearProps: "all" });
          });
        });
        return () => offs.forEach((off) => off());
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-work-motion>
      {children}
    </div>
  );
}
