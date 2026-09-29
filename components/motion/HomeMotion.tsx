"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Homepage motion (DESIGN §11, REFERENCE §4 patterns P1–P4/P7, §9 Supreme adjustments).
 * Reads data-* hooks from the server-rendered sections. All start states are set here, never in CSS,
 * so the page is complete without JavaScript. Under prefers-reduced-motion: reduce nothing runs.
 */
export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const rXl = cssPx(root, "--r-xl", 32);
      const rLg = cssPx(root, "--r-lg", 24);
      const frame = cssPx(root, "--frame", 12);
      const mm = gsap.matchMedia();

      mm.add(MQ.full, (ctx) => {
        const isDesktop = window.matchMedia(MQ.desktop).matches;
        const q = gsap.utils.selector(root);

        /* Hero: load entrance as Rise (DESIGN §11: opacity stays 1, so the h1/poster remain the LCP), hairline draw, scroll inset, mild parallax */
        const heroCopy = q("[data-hero-copy] > *");
        if (heroCopy.length) {
          gsap.fromTo(heroCopy, { y: 32 }, { y: 0, duration: 0.9, ease: ease.out, stagger: 0.08, delay: 0.1 });
        }
        const lines = q("[data-hairline]");
        if (lines.length) {
          gsap.fromTo(lines, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: ease.precise, stagger: 0.04, delay: 0.1 });
        }
        const heroMedia = q("[data-hero-media]")[0];
        const hero = q("[data-hero]")[0];
        if (hero && heroMedia) {
          gsap.fromTo(
            heroMedia,
            { clipPath: `inset(0px 0px 0px 0px round 0px)` },
            {
              clipPath: `inset(${frame}px ${frame}px 0px ${frame}px round ${rXl}px ${rXl}px 0px 0px)`,
              ease: "none",
              scrollTrigger: { trigger: hero, start: "top top", end: "40% top", scrub: true },
            },
          );
          const copy = q("[data-hero-copy]")[0];
          if (copy) {
            gsap.to(copy, { yPercent: -10, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
          }
          const film = q("[data-hero-film-layer]")[0];
          if (film) {
            gsap.to(film, { yPercent: 4, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
          }
        }

        /* Statement: word colour reveal tied to scroll (DESIGN §11 formula) */
        q("[data-statement]").forEach((el) => {
          const words = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
          if (!words.length) return;
          el.setAttribute("data-ready", "");
          let active = -1;
          ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            end: "bottom 45%",
            scrub: true,
            onUpdate: (self) => {
              const n = Math.round(self.progress * words.length);
              if (n === active) return;
              active = n;
              words.forEach((w, i) => w.classList.toggle("is-on", i < n));
            },
          });
        });

        /* P3 blur-in headings */
        q("[data-blur-in]").forEach((el) => {
          gsap.fromTo(
            el,
            { filter: "blur(12px)", opacity: 0, y: 20 },
            { filter: "blur(0px)", opacity: 1, y: 0, duration: 1, ease: ease.out, clearProps: "filter", scrollTrigger: { trigger: el, start: "top 80%", once: true } },
          );
        });

        /* P4 container expand for inverse bands (clip only, no colour step) */
        q("[data-expand]").forEach((el) => {
          const bottomRadius = el.hasAttribute("data-expand-top-only") ? "0px 0px" : `${rXl}px ${rXl}px`;
          gsap.fromTo(
            el,
            { clipPath: `inset(6% 4% 0% 4% round ${rXl}px ${rXl}px ${bottomRadius})` },
            {
              clipPath: `inset(0% 0% 0% 0% round ${rXl}px ${rXl}px ${bottomRadius})`,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 20%", scrub: true },
            },
          );
        });

        /* Rise: text blocks and glass panels, 32px → 0, opacity stays 1 */
        q("[data-rise]").forEach((group) => {
          const items = group.matches("[data-rise-item]") ? [group] : Array.from(group.querySelectorAll("[data-rise-item]"));
          if (!items.length) return;
          gsap.fromTo(items, { y: 32 }, { y: 0, duration: 0.8, ease: ease.brand, stagger: 0.08, scrollTrigger: { trigger: group, start: "top 85%", once: true } });
        });

        /* Mask reveal for media below the fold */
        q("[data-mask]").forEach((el) => {
          const inner = el.querySelector("[data-media-inner]");
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
          tl.fromTo(el, { clipPath: `inset(6% round ${rLg}px)` }, { clipPath: `inset(0% round ${rLg}px)`, duration: 1.1, ease: ease.precise, clearProps: "clipPath" }, 0);
          if (inner) tl.fromTo(inner, { scale: 1.06 }, { scale: 1, duration: 1.1, ease: ease.precise }, 0);
        });

        /* Parallax in Details and Impressies only, ≤ 6% of frame height, desktop only */
        if (isDesktop) {
          q("[data-parallax]").forEach((el, i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            gsap.fromTo(el, { yPercent: 3 * dir }, { yPercent: -3 * dir, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
          });
        }

        /* Footer wordmark: letters rise inside overflow: hidden (REFERENCE 5.7, no tilt) */
        const letters = gsap.utils.toArray<HTMLElement>("[data-footer] [data-letter]");
        if (letters.length) {
          gsap.fromTo(letters, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: ease.out, stagger: 0.03, scrollTrigger: { trigger: letters[0].closest("[data-footer]"), start: "top 75%", once: true } });
        }
        const footer = document.querySelector<HTMLElement>("[data-footer]");
        if (footer) {
          gsap.fromTo(
            footer,
            { clipPath: `inset(6% 4% 0% 4% round ${rXl}px ${rXl}px 0px 0px)` },
            { clipPath: `inset(0% 0% 0% 0% round ${rXl}px ${rXl}px 0px 0px)`, ease: "none", scrollTrigger: { trigger: footer, start: "top bottom", end: "top 30%", scrub: true } },
          );
        }

        ctx.add(() => ScrollTrigger.refresh());
        return () => {
          root.querySelectorAll("[data-statement]").forEach((el) => el.removeAttribute("data-ready"));
        };
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-home-motion>
      {children}
    </div>
  );
}
