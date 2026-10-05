"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";
import styles from "./Work.module.css";

/**
 * Handoff (desktop, 2026-10-05): as the band scrolls in under the night hero, a ghost of each of the film's four
 * window boxes travels from its window to its card's place in the stack, one after another, the bottom of the
 * stack first, turning into the card on the way (its lime line and dot fade, its corners round, the card's tone
 * fills it), and each card fades in where its ghost stops. Phones (no windows on screen): the first card and its photographs come up and settle, scrubbed. Then the
 * deck after the reference, on every width:
 * the deck is then pinned one viewport tall; the cards still to come wait as strips below the active card (each one a
 * little narrower), and each next card rises to the top and grows to full width over the current one while its
 * photographs slide in from the right and its note settles, scrubbed. On a fine pointer the card's pill follows the
 * pointer anywhere on the card and returns to the photographs when it leaves. Start states live here; without this the
 * CSS lists the cards (reduced motion, no JS).
 */
export function WorkMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const mm = gsap.matchMedia();

      // Phones: arrival. The first card and its photographs come up and settle as the band scrolls in
      mm.add(`${MQ.full} and (max-width: 767px)`, () => {
        const section = root.closest("[data-work]") as HTMLElement | null;
        const q = gsap.utils.selector(root);
        const first = q<HTMLElement>("[data-work-card]")[0];
        if (!section || !first) return;
        const firstPhotos = first.querySelector<HTMLElement>("[data-work-photos]");
        gsap.set(first, { y: 96, scale: 0.94 });
        if (firstPhotos) gsap.set(firstPhotos, { xPercent: 10 });
        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: { trigger: section, start: "top 95%", end: "top 12%", scrub: 0.8, invalidateOnRefresh: true },
        });
        tl.to(first, { y: 0, scale: 1, duration: 0.8 }, 0.15).to(firstPhotos, { xPercent: 0, duration: 0.7 }, 0.3);
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          gsap.set([first, firstPhotos], { clearProps: "transform,opacity" });
        };
      });

      // Desktop: the handoff from the film's windows to the cards
      mm.add(`${MQ.full} and ${MQ.desktop}`, () => {
        const section = root.closest("[data-work]") as HTMLElement | null;
        const q = gsap.utils.selector(root);
        const deck = q<HTMLElement>("[data-work-deck]")[0];
        const cards = q<HTMLElement>("[data-work-card]");
        const boxes = cards.map((card) => document.querySelector<HTMLElement>(`[data-window="${card.dataset.project}"]`));
        if (!section || !deck || !cards.length || boxes.some((b) => !b)) return;
        const docEl = document.documentElement;
        const top = () => (cssPx(docEl, "--header-h", 64) + cssPx(docEl, "--s-5", 24)) * 1.9;
        const radius = cssPx(docEl, "--r-md", 18);
        const clamp = (v: number) => Math.min(1, Math.max(0, v));
        const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

        // One ghost per window, built from the card's own tone
        const layer = document.createElement("div");
        layer.setAttribute("aria-hidden", "true");
        const n = cards.length;
        // Each ghost has its own share of the scroll: the last card's first, the first card's last, overlapping a little
        const SPAN = 0.55;
        const startOf = (i: number) => ((n - 1 - i) / Math.max(1, n - 1)) * (1 - SPAN);
        const ghosts = cards.map((card, i) => {
          const g = document.createElement("div");
          g.className = styles.ghost;
          g.style.zIndex = String(n - i);
          const tint = document.createElement("span");
          tint.className = styles.ghostTint;
          const line = document.createElement("span");
          line.className = styles.ghostLine;
          const dot = document.createElement("span");
          dot.className = styles.ghostDot;
          const fill = document.createElement("span");
          fill.className = styles.ghostFill;
          fill.style.background = getComputedStyle(card).backgroundColor;
          g.append(tint, line, dot, fill);
          layer.append(g);
          return { g, tint, line, dot, fill };
        });
        document.body.append(layer);
        gsap.set(cards, { opacity: 0 });
        gsap.set(layer, { autoAlpha: 0 });

        const update = (p: number) => {
          const deckRect = deck.getBoundingClientRect();
          gsap.set(layer, { autoAlpha: p > 0 && p < 1 ? 1 : 0 });
          cards.forEach((card, i) => {
            const box = boxes[i]!;
            const { g, tint, line, dot, fill } = ghosts[i];
            const q = clamp((p - startOf(i)) / SPAN); // this ghost's own progress
            const e = easeInOut(q);
            // From the window where it is now (the hero is scrolling away) to the card's place once the deck is pinned
            const from = box.getBoundingClientRect();
            const cr = card.getBoundingClientRect();
            const to = { left: cr.left, top: top() + (cr.top - deckRect.top), width: cr.width, height: cr.height };
            gsap.set(g, {
              left: from.left + (to.left - from.left) * e,
              top: from.top + (to.top - from.top) * e,
              width: from.width + (to.width - from.width) * e,
              height: from.height + (to.height - from.height) * e,
              borderRadius: 2 + (radius - 2) * e,
              opacity: 1 - clamp((q - 0.9) / 0.1),
            });
            gsap.set(dot, { opacity: 1 - clamp(q / 0.2) });
            gsap.set([tint, line], { opacity: 1 - clamp(q / 0.35) });
            gsap.set(fill, { opacity: clamp(q / 0.3) });
            // The film's own box steps aside while its ghost travels
            box.style.visibility = p > 0.02 && p < 1 ? "hidden" : "";
            // The card is solid before its ghost lets go, so the stack beneath never shows through
            gsap.set(card, { opacity: clamp((q - 0.76) / 0.12) });
          });
        };
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: () => `top ${top()}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });
        return () => {
          st.kill();
          layer.remove();
          boxes.forEach((b) => b && (b.style.visibility = ""));
          gsap.set(cards, { clearProps: "opacity" });
        };
      });

      mm.add(MQ.full, () => {
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
