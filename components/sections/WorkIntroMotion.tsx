"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const PIN = 1.4; // viewports the band stays pinned
const REVOLUTION = 80; // seconds for one turn of the ring on its own
const SCROLL_TURN = 0.0016; // radians per scrolled pixel: the turn follows the scrolling pace
const RING = { near: 0.68, far: 1 }; // ring size with the pointer on the headline (closer) and at rest
const SMOOTH = 0.08; // per-frame lerp of the driven values (on top of Lenis)

/** How far each mascot lags behind the headline once the band scrolls on (its depth), as a share of the stage. */
const LAG = [0.24, 0.14, 0.28, 0.17, 0.26, 0.12, 0.21];

/**
 * After the reference recordings. The mascots are always a ring around the headline. Left alone the ring turns
 * slowly on its own, each mascot leaning a little as it goes round; while the page scrolls the turn follows the
 * scrolling pace (so much turn per scrolled pixel, smoothed on top of Lenis); with the pointer on the headline the
 * headline fills in from grey to ink word by word and the ring draws closer, still turning slowly. On a coarse
 * pointer the headline fills in with the pinned scroll instead. After the pin each mascot lags behind at its own
 * depth as the band scrolls on. One ticker places everything (transforms only). Reduced motion: the still ring and
 * the ink headline. On a fine pointer a mascot also tilts towards the cursor.
 */
export function WorkIntroMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest("[data-work-intro]") as HTMLElement | null;
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const q = gsap.utils.selector(root);
        const stage = q<HTMLElement>("[data-orbit]")[0];
        const items = q<HTMLElement>("[data-orbit-item]");
        const inners = q<HTMLElement>("[data-orbit-inner]");
        const words = q<HTMLElement>("[data-orbit-word]");
        if (!section || !stage || !items.length || !words.length) return;

        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        const ink = getComputedStyle(section).color;
        const from = getComputedStyle(section).getPropertyValue("--reveal-from").trim() || ink;
        gsap.set(words, { color: from });
        gsap.set(items, { force3D: true });
        gsap.set(inners, { force3D: true, transformOrigin: "50% 50%" });

        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        // Pinned; on a coarse pointer the headline fills in with the scroll (no hover there)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${window.innerHeight * PIN}`,
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        if (!fine) tl.to(words, { color: ink, duration: 0.12, stagger: 0.07, ease: ease.out }, 0.1);
        else tl.to({}, { duration: 1 });
        const pinST = tl.scrollTrigger!;

        // After the pin: how far the band has scrolled on (the lag)
        const lagST = ScrollTrigger.create({ trigger: section, start: () => pinST.end, end: () => pinST.end + window.innerHeight, invalidateOnRefresh: true });

        let t = 0;
        let rx = 0;
        let ry = 0;
        let h = 0;
        const measure = () => {
          rx = stage.clientWidth * RX;
          ry = stage.clientHeight * RY;
          h = stage.clientHeight;
        };
        measure();
        let scrolled = 0; // turn added by the scrolling, in radians
        let velocity = 0; // smoothed scroll speed, px per frame
        let lastY = window.scrollY;
        let near = 0; // 1 with the pointer on the headline
        let nearTarget = 0;
        let lag = 0;
        const place = () => {
          const turn = (t / REVOLUTION) * Math.PI * 2 + scrolled;
          const ring = RING.far + (RING.near - RING.far) * near;
          items.forEach((el, i) => {
            const { a, k } = base[i];
            gsap.set(el, {
              x: (Math.cos(a + turn) * ring - Math.cos(a)) * rx * k,
              y: (Math.sin(a + turn) * ring - Math.sin(a)) * ry * k + LAG[i % LAG.length] * h * lag,
            });
            // a slight lean as it goes round, each mascot out of phase
            gsap.set(inners[i], { rotation: 7 * Math.sin(turn * 1.5 + i * 0.9) });
          });
        };
        const tick = (_time: number, dt: number) => {
          t += dt / 1000;
          const y = window.scrollY;
          velocity += (y - lastY - velocity) * SMOOTH * 2;
          lastY = y;
          scrolled += velocity * SCROLL_TURN;
          near += (nearTarget - near) * SMOOTH;
          lag += (lagST.progress - lag) * SMOOTH;
          place();
        };
        const visible = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: () => pinST.end + window.innerHeight * 1.2,
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
          onRefresh: () => {
            measure();
            lastY = window.scrollY;
            lag = lagST.progress;
            place();
          },
        });
        lag = lagST.progress;
        place();
        if (visible.isActive) gsap.ticker.add(tick);

        const offs: (() => void)[] = [];
        if (fine) {
          // Pointer on the headline: it fills in word by word and the ring draws closer
          const title = q<HTMLElement>("[data-orbit-title]")[0];
          if (title) {
            const enter = () => {
              nearTarget = 1;
              gsap.to(words, { color: ink, duration: 0.5, stagger: 0.05, ease: ease.out, overwrite: "auto" });
            };
            const leave = () => {
              nearTarget = 0;
              gsap.to(words, { color: from, duration: 0.6, stagger: 0.03, ease: ease.out, overwrite: "auto" });
            };
            title.addEventListener("pointerenter", enter);
            title.addEventListener("pointerleave", leave);
            offs.push(() => {
              title.removeEventListener("pointerenter", enter);
              title.removeEventListener("pointerleave", leave);
            });
          }
          // Pointer on a mascot: it leans towards the cursor
          q<HTMLElement>("[data-orbit-tilt]").forEach((el) => {
            gsap.set(el, { transformPerspective: 700 });
            const rX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: ease.out });
            const rY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: ease.out });
            const sc = gsap.quickTo(el, "scale", { duration: 0.6, ease: ease.out });
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              rX(-((e.clientY - r.top) / r.height - 0.5) * 22);
              rY(((e.clientX - r.left) / r.width - 0.5) * 22);
              sc(1.08);
            };
            const leave = () => {
              rX(0);
              rY(0);
              sc(1);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            offs.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
        }

        return () => {
          gsap.ticker.remove(tick);
          visible.kill();
          lagST.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          offs.forEach((off) => off());
          // never clearProps "all": the items carry React inline positions
          gsap.set([items, inners, q("[data-orbit-tilt]")], { clearProps: "transform" });
          gsap.set(words, { clearProps: "color" });
          ScrollTrigger.refresh();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-work-intro-motion style={{ display: "contents" }}>
      {children}
    </div>
  );
}
