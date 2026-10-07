"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";
import styles from "./Work.module.css";

/**
 * The projects band (2026-10-07, owner): it slides up over the held night hero; the film's windows stay on it as lime
 * frames; the title comes up; the frames travel to their cards and become them; the title goes; then the deck after
 * the reference, on every width: pinned one viewport tall, the cards still to come waiting as strips beneath the
 * active card, each next card rising to the front as the one above lifts away, its photographs sliding in and its
 * note settling, scrubbed. On a fine pointer the card's pill follows the pointer. The next band's daylight rises
 * over the band's foot. Start states live here; without this the CSS lists the cards (reduced motion, no JS).
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

      // The band stays dark to its foot; the next band brings daylight up over it as a long soft rise of Paper
      // (Shelf.module.css, [data-dawn]) instead of the whole band fading through grey, so the last card leaves on
      // the dark ground and no edge ever shows between the two. Only with motion: without it the bands simply meet.
      let fading = false;
      mm.add(MQ.full, () => {
        if (!band || !next) return;
        fading = true;
        next.setAttribute("data-dawn", "");
        return () => {
          fading = false;
          next.removeAttribute("data-dawn");
        };
      });
      const dark = band
        ? ScrollTrigger.create({
            trigger: band,
            start: "top 48px",
            endTrigger: next ?? band,
            end: () => (fading && next ? "top 40%" : next ? "top 48px" : "bottom 48px"), // light once the rise is behind the header
            invalidateOnRefresh: true,
            refreshPriority: -1,
            onToggle: (self) => header(self.isActive),
          })
        : null;

      // The arrival and the deck (owner, 2026-10-07). The band slides up over the held night hero (HeroScroll) with
      // only its title on it, word by word; the title is gone the moment the band fills the view; the band's root is
      // then pinned, the cards rise in and, after a short rest, the stack plays. Same on every width.
      // Without JS / reduced motion: the title heads the list and the cards follow one another.
      mm.add(MQ.full, () => {
        if (!band) return;
        const q = gsap.utils.selector(root);
        const deck = q<HTMLElement>("[data-work-deck]")[0];
        const cards = q<HTMLElement>("[data-work-card]");
        const lead = q<HTMLElement>("[data-work-lead]")[0];
        const n = cards.length;
        if (!deck || n < 2) return;
        const docEl = document.documentElement;
        const top = () => (cssPx(docEl, "--header-h", 64) + cssPx(docEl, "--s-5", 24)) * 1.9;
        const peek = () => cssPx(deck, "--peek", 48);
        const DEPTH = 34; // px of depth per step down the stack (the deck has perspective)
        const HAND = 0.9; // the cards' arrival (and a short rest) before the first card lifts, in card steps

        // The root is what is pinned (title and deck together); the band's top room equals the stack's top, so the
        // pin begins exactly as the band has covered the hero
        root.setAttribute("data-handoff", "");
        // ... and a foot as tall as most of the next band's daylight rise, so the last card (which stays and scrolls
        // away with the page) is never washed by it, and the light comes up just behind it
        gsap.set(band, { paddingTop: () => top(), paddingBottom: () => window.innerHeight * 0.56 });

        deck.setAttribute("data-deck", "");
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

        /* ---------- the pinned timeline: arrival, then the stack ---------- */
        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: root,
            start: () => `top ${top()}`,
            end: () => `+=${(n - 1 + HAND + 0.25) * window.innerHeight * 0.85}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        // While the band covers the hero it carries only its title: the words rise into view one after another out of
        // their masks as the band comes up, then leave the same way, upwards, one after another, the last gone the
        // moment the band fills the view. No cards until then.
        gsap.set(deck, { autoAlpha: 0 });
        const words = lead ? Array.from(lead.querySelectorAll<HTMLElement>("[data-lead-word]")) : [];
        const title = words.length
          ? gsap
              .timeline({ scrollTrigger: { trigger: band, start: "top 94%", end: "top 1%", scrub: 0.6, invalidateOnRefresh: true } })
              .fromTo(words, { yPercent: 115, rotate: 6, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power3.out" }, 0)
              .to(words, { yPercent: -115, rotate: -4, opacity: 0, duration: 0.24, stagger: 0.035, ease: "power2.in" }, 0.62)
          : null;

        // Then the cards rise in, as one stack, with a strong ease-out, and rest a moment before the first lifts
        tl.fromTo(deck, { autoAlpha: 0, y: () => window.innerHeight * 0.5 }, { autoAlpha: 1, y: 0, duration: HAND * 0.7, ease: "expo.out", immediateRender: false }, 0);

        // Every card but the last is lifted away; the last one stays and leaves with the page, so the band never
        // shows an empty screen before the daylight
        for (let i = 0; i < n - 1; i++) {
          const at = HAND + i;
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
            at,
          );
          const inner = cards[i].querySelector<HTMLElement>("article");
          if (inner) tl.to(inner, { rotationX: 14, y: -28, duration: 0.5, ease: "power1.out" }, at);
          // ... while the stack beneath stays where it is (fixed at the foot, owner): the cards only come forward
          // one step in depth, the next one to the front
          for (let j = i + 1; j < n; j++) {
            const step = j - i - 1;
            tl.to(cards[j], { z: -DEPTH * step, duration: 1, ease: "power1.inOut" }, at);
          }
          const next = cards[i + 1];
          if (next) {
            tl.to(next.querySelector("[data-work-photos]"), { xPercent: 0, duration: 0.6 }, at + 0.4).to(next.querySelector("[data-work-note]"), { y: 0, opacity: 1, duration: 0.5 }, at + 0.5);
          }
        }

        tl.to({}, { duration: 0.25 }); // the last card rests a moment before the page moves on

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          title?.scrollTrigger?.kill();
          title?.kill();
          gsap.set(words, { clearProps: "transform,opacity" });
          root.removeAttribute("data-handoff");
          deck.removeAttribute("data-deck");
          gsap.set(band, { clearProps: "paddingTop,paddingBottom" });
          gsap.set(cards, { clearProps: "transform,zIndex,transformOrigin" }); // not "all": the cards carry inline custom properties
          gsap.set(q("[data-work-card] article"), { clearProps: "transform,transformOrigin" });
          gsap.set(deck, { clearProps: "perspective,opacity,visibility,transform" });
          if (lead) gsap.set(lead, { clearProps: "opacity,transform" });
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
    <div ref={scope} className={styles.motion} data-work-motion>
      {children}
    </div>
  );
}
