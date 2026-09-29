"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Flip } from "gsap/Flip";
import { cssPx, ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

/**
 * Homepage motion after REFERENCE-MOTION.md §4–§5 with the §9 Supreme adjustments (tilt 0°, no chips,
 * no float, toned pops, power2.inOut scrubs). All start states are set here, never in CSS, so the page is
 * complete without JavaScript. Under prefers-reduced-motion: reduce nothing runs and the CSS defaults
 * (stacked cards, snap-scroller, small capsule) stay.
 */
export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      gsap.registerPlugin(Flip);
      const root = scope.current!;
      const rXl = cssPx(root, "--r-xl", 32);
      const cs = getComputedStyle(root);
      const glass = cs.getPropertyValue("--glass").trim() || "rgba(250,250,247,.74)";
      const surface = cs.getPropertyValue("--inv-btn-bg").trim() || "#FAFAF7";
      const mm = gsap.matchMedia();

      mm.add(MQ.full, (ctx) => {
        const isDesktop = window.matchMedia(MQ.desktop).matches;
        const q = gsap.utils.selector(root);

        /* ---------- 5.1 Hero: load sequence + scroll parallax ---------- */
        const heroBg = q("[data-hero-bg]")[0];
        const heroSubject = q("[data-hero-subject]")[0];
        const heroCopy = q("[data-hero-copy] > *");
        const hero = q("[data-hero]")[0];
        if (heroBg) gsap.fromTo(heroBg, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "power2.out" });
        if (heroSubject) gsap.fromTo(heroSubject, { yPercent: 12, scale: 0.92 }, { yPercent: 0, scale: 1, duration: 1.4, ease: ease.out, delay: 0.15 });
        // Headline rises without an opacity fade so it stays the LCP candidate; lead and CTA fade up (P1).
        if (heroCopy.length) {
          gsap.fromTo(heroCopy[0], { y: 40 }, { y: 0, duration: 0.9, ease: ease.out, delay: 0.3 });
          gsap.fromTo(heroCopy.slice(1), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease.out, stagger: 0.08, delay: 0.38 });
        }
        if (hero) {
          const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true } as const;
          const copy = q("[data-hero-copy]")[0];
          if (copy) gsap.to(copy, { yPercent: -20, ease: "none", scrollTrigger: st });
          if (heroSubject) gsap.to(heroSubject, { yPercent: -8, ease: "none", scrollTrigger: st });
          if (heroBg) gsap.to(heroBg, { yPercent: 4, ease: "none", scrollTrigger: st });
        }

        /* ---------- 5.2 Statement: word reveal, capsules P1 + scale ---------- */
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
        const capsules = q("[data-capsule]");
        if (capsules.length) {
          gsap.fromTo(capsules, { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: ease.out, stagger: 0.08, scrollTrigger: { trigger: capsules[0], start: "top 85%", once: true } });
        }

        /* ---------- P1 generic fade-up, P3 blur-in ---------- */
        q("[data-fade-up]").forEach((el) => {
          const items = el.children.length > 1 ? Array.from(el.children) : [el];
          gsap.fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease.out, stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
        q("[data-blur-in]").forEach((el) => {
          gsap.fromTo(el, { filter: "blur(12px)", opacity: 0, y: 20 }, { filter: "blur(0px)", opacity: 1, y: 0, duration: 1, ease: ease.out, clearProps: "filter", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
        });

        /* ---------- P4 container expand for dark bands ---------- */
        q("[data-expand]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: `inset(6% 4% 0% 4% round ${rXl}px)` },
            { clipPath: `inset(0% 0% 0% 0% round ${rXl}px)`, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 20%", scrub: true } },
          );
        });

        /* ---------- 5.3 Pinned principles (desktop only) ---------- */
        const pinned = q("[data-pinned-principles]")[0];
        if (pinned && isDesktop) {
          const head = q("[data-pin-head]")[0];
          const photo = q("[data-pin-photo]")[0];
          const card1 = q('[data-pin-card="1"]')[0];
          const card2 = q('[data-pin-card="2"]')[0];
          const card3 = q('[data-pin-card="3"]')[0];
          const thumb = q("[data-pin-thumb]")[0];
          const tl = gsap.timeline({
            defaults: { ease: ease.inOut },
            scrollTrigger: { trigger: pinned, start: "top top", end: "+=220%", pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
          });
          gsap.set([card2, card3], { opacity: 0 });
          gsap.set(card2, { x: 60, backgroundColor: glass, backdropFilter: "blur(14px)" });
          gsap.set(card3, { x: -60, backgroundColor: glass, backdropFilter: "blur(14px)" });
          gsap.set(card1, { x: -60, opacity: 0 });
          gsap.set(thumb, { scale: 0.9, opacity: 0 });
          tl.fromTo(head, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.15 }, 0)
            .to(card1, { x: 0, opacity: 1, duration: 0.2 }, 0.1)
            .to(thumb, { scale: 1, opacity: 1, duration: 0.12, ease: ease.out }, 0.2)
            .to(photo, { yPercent: -35, duration: 1, ease: "none" }, 0)
            .to(head, { y: -60, opacity: 0, duration: 0.15 }, 0.35)
            .to(card1, { x: -80, y: -60, opacity: 0, duration: 0.15 }, 0.35)
            .to(card2, { x: 0, opacity: 1, duration: 0.1 }, 0.4)
            .to(card2, { backgroundColor: surface, backdropFilter: "blur(0px)", duration: 0.1 }, 0.5)
            .to(card3, { x: 0, opacity: 1, duration: 0.1 }, 0.5)
            .to(card3, { backgroundColor: surface, backdropFilter: "blur(0px)", duration: 0.1 }, 0.6)
            .to({}, { duration: 0.15 }, 0.85);
        } else if (pinned) {
          q("[data-pin-card]").forEach((card) => {
            gsap.fromTo(card, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease.out, scrollTrigger: { trigger: card, start: "top 88%", once: true } });
          });
        }

        /* ---------- 5.4 Carousel (desktop only): pinned card-pair sequence ---------- */
        const stage = q("[data-carousel-stage]")[0];
        if (stage && isDesktop) {
          stage.classList.add("is-pinned");
          const inner1 = q('[data-text-inner="1"]')[0];
          const photo1 = q('[data-photo-card="1"]')[0];
          const text2 = q('[data-text-card="2"]')[0];
          const text3 = q('[data-text-card="3"]')[0];
          const photo3 = q('[data-photo-card="3"]')[0];
          const pager1 = q('[data-pager="1"] [data-pager-current]')[0];
          gsap.set(text2, { opacity: 0, filter: "blur(8px)" });
          gsap.set(text3, { opacity: 0 });
          gsap.set(photo3, { clipPath: "inset(100% 0% 0% 0%)" });
          const setPager = (n: string) => () => {
            if (pager1) pager1.textContent = n;
          };
          const tl = gsap.timeline({
            defaults: { ease: ease.inOut },
            scrollTrigger: {
              trigger: stage.closest("[data-carousel]")!,
              start: "top top",
              end: "+=300%",
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onLeaveBack: setPager("01"),
            },
          });
          tl.to({}, { duration: 0.15 })
            // pair 1 → 2
            .to(photo1, { xPercent: -103, duration: 0.3 }, 0.15)
            .to(inner1, { opacity: 0, filter: "blur(8px)", duration: 0.2 }, 0.15)
            .to(text2, { opacity: 1, filter: "blur(0px)", duration: 0.25 }, 0.25)
            .add(setPager("02"), 0.3)
            .to({}, { duration: 0.15 })
            // pair 2 → 3
            .to(photo3, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.3 }, 0.6)
            .to(text2, { opacity: 0, filter: "blur(8px)", duration: 0.15 }, 0.62)
            .to(text3, { opacity: 1, duration: 0.2 }, 0.68)
            .add(setPager("03"), 0.7)
            .to({}, { duration: 0.15 }, 0.85);
        }

        /* ---------- 5.5 Map: background settles during the expand ---------- */
        const map = q("[data-map]")[0];
        const mapBand = q("[data-map-band]")[0];
        if (map && mapBand) {
          gsap.fromTo(map, { scale: 1.08 }, { scale: 1, ease: "none", scrollTrigger: { trigger: mapBand, start: "top bottom", end: "top 20%", scrub: true } });
        }

        /* ---------- Rise groups (Bedrijfsgegevens) ---------- */
        q("[data-rise]").forEach((group) => {
          const items = group.matches("[data-rise-item]") ? [group] : Array.from(group.querySelectorAll("[data-rise-item]"));
          if (!items.length) return;
          gsap.fromTo(items, { y: 32 }, { y: 0, duration: 0.8, ease: ease.brand, stagger: 0.08, scrollTrigger: { trigger: group, start: "top 85%", once: true } });
        });

        /* ---------- 5.7 Capsule → wide image → wordmark ---------- */
        const block = q("[data-capsule-block]")[0];
        const capsule = q("[data-capsule-hero]")[0];
        const target = q("[data-capsule-target]")[0];
        const marquee = q("[data-marquee-track]")[0];
        if (block && capsule && target && isDesktop) {
          const state = Flip.getState(capsule);
          target.appendChild(capsule);
          capsule.classList.add("is-wide");
          const flip = Flip.from(state, { duration: 1, ease: "none", absolute: false });
          const tl = gsap.timeline({
            scrollTrigger: { trigger: block, start: "top 15%", end: "+=120%", pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
          });
          tl.add(flip, 0);
          if (marquee) tl.to(marquee, { opacity: 0, duration: 0.4, ease: "none" }, 0);
        }
        const letters = q("[data-closing-wordmark] [data-letter]");
        if (letters.length) {
          gsap.fromTo(letters, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: ease.out, stagger: 0.03, scrollTrigger: { trigger: letters[0].closest("[data-closing-wordmark]"), start: "top 85%", once: true } });
        }
        const endCapsule = q("[data-end-capsule]")[0];
        if (endCapsule) {
          gsap.fromTo(endCapsule, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: ease.out, scrollTrigger: { trigger: endCapsule, start: "top 90%", once: true } });
        }
        const footerBar = document.querySelector("[data-footer-bar]");
        if (footerBar) {
          gsap.fromTo(footerBar.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease.out, stagger: 0.08, scrollTrigger: { trigger: footerBar, start: "top 92%", once: true } });
        }

        ctx.add(() => ScrollTrigger.refresh());
        return () => {
          root.querySelectorAll("[data-statement]").forEach((el) => el.removeAttribute("data-ready"));
          stage?.classList.remove("is-pinned");
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
