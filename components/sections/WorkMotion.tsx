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
        // --stack-top is a calc() in the CSS (the header veil's height), which cannot be read as a number: same sum here
        const docEl = document.documentElement;
        const top = () => (cssPx(docEl, "--header-h", 64) + cssPx(docEl, "--s-5", 24)) * 1.9;
        const DEPTH = 34; // px of depth per step down the stack (the deck has perspective)
        // The stack as in the reference: the first card on top, the ones to come beneath it, each a step lower and a
        // step deeper, so they show as strips under its foot
        gsap.set(deck, { perspective: 1400 });
        cards.forEach((card, i) => {
          gsap.set(card, { zIndex: n - i, y: () => i * peek(), z: -DEPTH * i, transformOrigin: "50% 100%", force3D: true });
          gsap.set(card.querySelector("article"), { transformOrigin: "50% 100%", transformPerspective: 1200, force3D: true });
        });
        cards.forEach((card, i) => {
          if (i === 0) return;
          gsap.set(card.querySelector("[data-work-photos]"), { xPercent: 12 });
          gsap.set(card.querySelector("[data-work-note]"), { y: 24, opacity: 0 });
        });

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: deck,
            start: () => `top ${top()}`,
            end: () => `+=${n * window.innerHeight * 0.85}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        for (let i = 0; i < n; i++) {
          // The card on top is lifted away like a sheet of paper: it tips back first (about 30°, still low), then
          // flies up, and settles to a lighter tilt as it leaves; its contents bend a little more than the card
          const h = () => deck.clientHeight;
          tl.to(
            cards[i],
            {
              keyframes: {
                "0%": { rotationX: 0, y: 0 },
                "40%": { rotationX: 30, y: () => -h() * 0.22 },
                "100%": { rotationX: 12, y: () => -h() * 1.45 },
                easeEach: "power1.inOut",
              },
              duration: 1,
              ease: "none",
            },
            i,
          );
          const inner = cards[i].querySelector<HTMLElement>("article");
          if (inner) tl.to(inner, { rotationX: 14, y: -28, duration: 0.5, ease: "power1.out" }, i);
          // ... while the stack beneath stays where it is (fixed at the foot, owner): the cards only come forward
          // one step in depth, the next one to the front
          for (let j = i + 1; j < n; j++) {
            const step = j - i - 1;
            tl.to(cards[j], { z: -DEPTH * step, duration: 1, ease: "power1.inOut" }, i);
          }
          const next = cards[i + 1];
          if (next) {
            tl.to(next.querySelector("[data-work-photos]"), { xPercent: 0, duration: 0.6 }, i + 0.4)
              .to(next.querySelector("[data-work-note]"), { y: 0, opacity: 1, duration: 0.5 }, i + 0.5);
          }
        }

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          deck.removeAttribute("data-deck");
          gsap.set(cards, { clearProps: "transform,zIndex,transformOrigin" }); // not "all": the cards carry inline custom properties
          gsap.set(q("[data-work-card] article"), { clearProps: "transform,transformOrigin" });
          gsap.set(deck, { clearProps: "perspective" });
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
