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
 * note settling, scrubbed. On a fine pointer the card's pill follows the pointer. The band's tone fades to Paper
 * before the next band. Start states live here; without this the CSS lists the cards (reduced motion, no JS).
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

      // The handoff and the deck (owner, 2026-10-07). The band has slid up over the held night hero (HeroScroll); the
      // windows stay on it, alone, as lime frames (plates in a fixed layer, so the band never hides them). Once it
      // has covered the hero, the band's root is pinned: the title comes up at the top, the frames travel to their
      // cards (solid in the card's tone early, one after another), the deck appears beneath them as they land and
      // they fade, so the cards' contents appear in place; the title goes as the stack shows; then the stack plays.
      // Phones (no windows on screen): the title, then the deck rises in. Without JS / reduced motion: the title
      // heads the list and the cards follow one another.
      mm.add({ full: MQ.full, desktop: MQ.desktop }, (ctx) => {
        if (!ctx.conditions?.full || !band) return;
        const q = gsap.utils.selector(root);
        const deck = q<HTMLElement>("[data-work-deck]")[0];
        const cards = q<HTMLElement>("[data-work-card]");
        const lead = q<HTMLElement>("[data-work-lead]")[0];
        const n = cards.length;
        if (!deck || n < 2) return;
        const docEl = document.documentElement;
        const top = () => (cssPx(docEl, "--header-h", 64) + cssPx(docEl, "--s-5", 24)) * 1.9;
        const peek = () => cssPx(deck, "--peek", 48);
        const radius = cssPx(docEl, "--r-md", 18);
        const clamp = (v: number) => Math.min(1, Math.max(0, v));
        const DEPTH = 34; // px of depth per step down the stack (the deck has perspective)
        const HAND = 1.6; // the handoff's share of the pinned timeline, in card steps

        // The root is what is pinned (title and deck together); the band's top room equals the stack's top, so the
        // pin begins exactly as the band has covered the hero
        root.setAttribute("data-handoff", "");
        gsap.set(band, { paddingTop: () => top() });

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
        if (lead) gsap.set(lead, { opacity: 0, yPercent: -20 });

        /* ---------- the plates (desktop: the film's windows are on screen) ---------- */
        const boxes = ctx.conditions.desktop ? cards.map((card) => document.querySelector<HTMLElement>(`[data-window="${card.dataset.project}"]`)) : [];
        const withPlates = boxes.length === n && boxes.every(Boolean);
        const layer = document.createElement("div");
        layer.setAttribute("aria-hidden", "true");
        const ghosts = withPlates
          ? cards.map((card, i) => {
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
            })
          : [];
        if (withPlates) document.body.append(layer);
        gsap.set(layer, { autoAlpha: 0 });
        if (withPlates) gsap.set(deck, { opacity: 0 });

        // Where the windows are: the hero is held until the pin below begins, then scrolls away under the band, so
        // a window's place is its place at that moment (measured now, less the distance scrolled since)
        let pinStart = 0;
        const fromRect = (box: HTMLElement) => {
          const r = box.getBoundingClientRect();
          const drift = Math.max(0, window.scrollY - pinStart);
          return { left: r.left, top: r.top + drift, width: r.width, height: r.height };
        };
        const TRAVEL = 0.62;
        const STAGGER = 0.07;
        const LANDED = (n - 1) * STAGGER + TRAVEL;
        const glideEase = gsap.parseEase("power3.inOut");
        let covering = false;
        let hand = 0; // 0..1 through the handoff
        const draw = () => {
          if (!withPlates) return;
          const flying = hand > 0 && hand < 1;
          const show = covering || flying;
          gsap.set(layer, { autoAlpha: show ? 1 - clamp((hand - LANDED) / (1 - LANDED)) : 0 });
          gsap.set(deck, { opacity: hand >= LANDED - 0.02 ? 1 : 0 });
          boxes.forEach((box) => box && (box.style.visibility = show ? "hidden" : ""));
          if (!show) return;
          cards.forEach((card, i) => {
            const { g, fill, tint, line, dot } = ghosts[i];
            const qn = clamp((hand - (n - 1 - i) * STAGGER) / TRAVEL); // this box's own travel
            const e = glideEase(qn);
            const from = fromRect(boxes[i]!);
            const to = card.getBoundingClientRect();
            gsap.set(g, {
              left: from.left + (to.left - from.left) * e,
              top: from.top + (to.top - from.top) * e,
              width: from.width + (to.width - from.width) * e,
              height: from.height + (to.height - from.height) * e,
              borderRadius: 2 + (radius - 2) * e,
            });
            gsap.set(dot, { opacity: 1 - clamp(qn / 0.12) });
            gsap.set(tint, { opacity: 1 - clamp(qn / 0.25) });
            gsap.set(line, { opacity: 1 - clamp((qn - 0.04) / 0.24) });
            gsap.set(fill, { opacity: clamp((qn - 0.04) / 0.26) });
          });
        };
        // While the band slides up over the held hero, the windows stand on it as plates
        const cover = ScrollTrigger.create({
          trigger: band,
          start: "top bottom",
          end: "top top",
          invalidateOnRefresh: true,
          onToggle: (self) => {
            covering = self.isActive;
            draw();
          },
          onUpdate: () => draw(),
        });

        /* ---------- the pinned timeline: handoff, then the stack ---------- */
        const proxy = { p: 0 };
        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: root,
            start: () => `top ${top()}`,
            end: () => `+=${(n + HAND) * window.innerHeight * 0.85}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              pinStart = self.start;
              draw();
            },
          },
        });
        // The handoff: title in, the plates fly and land (or, on phones, the deck rises in), title out
        tl.to(proxy, { p: 1, duration: HAND, ease: "none", onUpdate: () => ((hand = proxy.p), draw()) }, 0);
        if (lead) {
          // ... and it stays over the flight and the landing, and goes as the stack has shown
          tl.to(lead, { opacity: 1, yPercent: -50, duration: 0.3, ease: "power2.out" }, 0).to(lead, { opacity: 0, yPercent: -80, duration: 0.35, ease: "power2.in" }, HAND - 0.05);
        }
        if (!withPlates) tl.fromTo(deck, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: HAND * 0.6, ease: "power2.out" }, HAND * 0.35);

        for (let i = 0; i < n; i++) {
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

        return () => {
          cover.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          layer.remove();
          boxes.forEach((b) => b && (b.style.visibility = ""));
          root.removeAttribute("data-handoff");
          deck.removeAttribute("data-deck");
          gsap.set(band, { clearProps: "paddingTop" });
          gsap.set(cards, { clearProps: "transform,zIndex,transformOrigin" }); // not "all": the cards carry inline custom properties
          gsap.set(q("[data-work-card] article"), { clearProps: "transform,transformOrigin" });
          gsap.set(deck, { clearProps: "perspective,opacity,transform" });
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
