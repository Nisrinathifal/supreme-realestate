"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";
import styles from "./Work.module.css";

/**
 * Handoff (desktop, 2026-10-05): as the band scrolls in under the night hero, each of the film's four window boxes
 * travels to its card's place in the stack and turns into the card on the way: the lime dot and dashes give way,
 * the corners round, the card's own tone fills it, and the real card crossfades in under it, so the box becomes
 * the card with no gap and no outline left standing. The motion follows the scroll through a short damping, so it
 * glides rather than steps. Phones (no windows on screen): the deck rises in as one. Then the
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
      const band = root.closest<HTMLElement>("[data-work]");
      const next = band?.nextElementSibling as HTMLElement | null;
      const header = (dark: boolean) => document.dispatchEvent(new CustomEvent(HEADER_THEME, { detail: { key: "work", dark } }));

      // The band's tone (after the earlier projects intro): Canal ink while the deck plays, then, over the last
      // viewport before the next band shows, it fades to Paper, where that band's wall begins, so they meet in one colour.
      // The header reads it as dark until the fade is half way.
      let fading = false;
      mm.add(MQ.full, () => {
        if (!band || !next) return;
        fading = true;
        const tokens = getComputedStyle(document.documentElement);
        const tone = gsap.fromTo(
          band,
          { backgroundColor: tokens.getPropertyValue("--inv-bg").trim() },
          {
            backgroundColor: tokens.getPropertyValue("--bg").trim(),
            ease: "none",
            immediateRender: false,
            // Over the last viewport before the next band shows, so it is the same Stone by the time their edges meet
            scrollTrigger: { trigger: next, start: "top 190%", end: "top 100%", scrub: true, invalidateOnRefresh: true },
          },
        );
        return () => {
          fading = false;
          tone.scrollTrigger?.kill();
          tone.kill();
          gsap.set(band, { clearProps: "backgroundColor" });
        };
      });
      const dark = band
        ? ScrollTrigger.create({
            trigger: band,
            start: "top 48px",
            endTrigger: next ?? band,
            end: () => (fading && next ? "top 145%" : next ? "top 48px" : "bottom 48px"),
            invalidateOnRefresh: true,
            refreshPriority: -1,
            onToggle: (self) => header(self.isActive),
          })
        : null;

      // Phones: arrival. The deck rises and comes up as one as the band scrolls in
      mm.add(`${MQ.full} and (max-width: 767px)`, () => {
        const section = root.closest("[data-work]") as HTMLElement | null;
        const q = gsap.utils.selector(root);
        const deck = q<HTMLElement>("[data-work-deck]")[0];
        const first = q<HTMLElement>("[data-work-card]")[0];
        if (!section || !deck || !first) return;
        const firstPhotos = first.querySelector<HTMLElement>("[data-work-photos]");
        gsap.set(deck, { opacity: 0, y: 80 });
        if (firstPhotos) gsap.set(firstPhotos, { xPercent: 8 });
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: section, start: "top 92%", end: "top 30%", scrub: 1, invalidateOnRefresh: true },
        });
        tl.to(deck, { opacity: 1, y: 0, duration: 1 }, 0).to(firstPhotos, { xPercent: 0, duration: 0.8 }, 0.2);
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          gsap.set([deck, firstPhotos], { clearProps: "transform,opacity" });
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

        // One ghost per window, built from the card's own tone
        const layer = document.createElement("div");
        layer.setAttribute("aria-hidden", "true");
        const n = cards.length;
        const ghosts = cards.map((card, i) => {
          const g = document.createElement("div");
          g.className = styles.ghost;
          g.style.zIndex = String(n - i);
          const fill = document.createElement("span");
          fill.className = styles.ghostFill;
          fill.style.background = getComputedStyle(card).backgroundColor;
          const tint = document.createElement("span");
          tint.className = styles.ghostTint;
          const line = document.createElement("span");
          line.className = styles.ghostLine;
          const dot = document.createElement("span");
          dot.className = styles.ghostDot;
          g.append(fill, tint, line, dot);
          layer.append(g);
          return { g, fill, tint, line, dot };
        });
        document.body.append(layer);
        gsap.set(deck, { opacity: 0 }); // the deck comes up as one, so no card ever shows through another
        gsap.set(layer, { autoAlpha: 0 });

        // Shares of the scroll (2026-10-07, smoother): the boxes leave one after another (the bottom of the stack
        // first) and turn solid early, in their card's tone, so no plate is ever see-through over another; the dashes,
        // the lime wash and the dot are gone within the first third of the flight. Only once every plate has landed
        // on its card does the real deck come up beneath them (invisibly: same place, same tone), and then the
        // plates fade, so the cards' contents appear in place
        const TRAVEL = 0.62;
        const STAGGER = 0.07;
        const LANDED = (n - 1) * STAGGER + TRAVEL;
        const glideEase = gsap.parseEase("power3.inOut");
        const update = (p: number) => {
          gsap.set(deck, { opacity: p >= LANDED - 0.02 ? 1 : 0 });
          const out = 1 - clamp((p - LANDED) / (1 - LANDED));
          gsap.set(layer, { autoAlpha: p > 0.001 && p < 0.999 ? out : 0 });
          cards.forEach((card, i) => {
            const box = boxes[i]!;
            const { g, fill, tint, line, dot } = ghosts[i];
            const q = clamp((p - (n - 1 - i) * STAGGER) / TRAVEL); // this box's own travel
            const e = glideEase(q);
            // From the window where it is now (the hero is scrolling away) to the card where it is now (the deck
            // is scrolling in): both ends move with the page, so a landed plate rides with its card
            const from = box.getBoundingClientRect();
            const to = card.getBoundingClientRect();
            gsap.set(g, {
              left: from.left + (to.left - from.left) * e,
              top: from.top + (to.top - from.top) * e,
              width: from.width + (to.width - from.width) * e,
              height: from.height + (to.height - from.height) * e,
              borderRadius: 2 + (radius - 2) * e,
            });
            gsap.set(dot, { opacity: 1 - clamp(q / 0.12) });
            gsap.set(tint, { opacity: 1 - clamp(q / 0.25) });
            gsap.set(line, { opacity: 1 - clamp((q - 0.04) / 0.24) });
            gsap.set(fill, { opacity: clamp((q - 0.04) / 0.26) });
            // The film's own box steps aside while its plate travels
            box.style.visibility = p > 0.01 && p < 0.999 ? "hidden" : "";
          });
        };
        // Damping: the drawn progress eases after the scroll's, so the plates glide instead of stepping
        const shown = { p: 0 };
        const glide = (target: number, now = false) =>
          now
            ? (gsap.killTweensOf(shown), (shown.p = target), update(target))
            : gsap.to(shown, { p: target, duration: 0.7, ease: "power3.out", overwrite: true, onUpdate: () => update(shown.p) });
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: () => `top ${top()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => glide(self.progress),
          onRefresh: (self) => glide(self.progress, true),
        });
        return () => {
          st.kill();
          gsap.killTweensOf(shown);
          layer.remove();
          boxes.forEach((b) => b && (b.style.visibility = ""));
          gsap.set(deck, { clearProps: "opacity" });
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

      return () => {
        dark?.kill();
        header(false);
        mm.revert();
      };
    },
    { scope },
  );

  return (
    <div ref={scope} data-work-motion>
      {children}
    </div>
  );
}
