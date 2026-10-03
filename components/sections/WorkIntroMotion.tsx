"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const PIN = 1.4; // viewports the band stays pinned
const REVOLUTION = 90; // seconds for one turn of the ring on its own (the first version's pace)
const SCROLL_TURN = Math.PI / 2; // a quarter turn more over the pinned scroll

/** How far each mascot lags behind the headline once the band scrolls on (its depth), as a share of the stage. */
const LAG = [0.34, 0.2, 0.4, 0.24, 0.36, 0.18, 0.3];

/**
 * The ring stays a ring (owner, 2026-10-03): the mascots keep their formation and turn, slowly on their own as in
 * the first version and a quarter turn more with the pinned scroll, so scrolling and the ring feel joined. One
 * ticker places every mascot from its angle (positions from the stage size, so the ring follows a resize). While the
 * band is pinned the headline fills in from grey to ink word by word, scrubbed. After the pin each mascot lags behind
 * the headline at its own depth as the band scrolls on. Reduced motion: the still ring, the ink headline. On a fine
 * pointer a mascot tilts towards the cursor.
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
        const words = q<HTMLElement>("[data-orbit-word]");
        if (!section || !stage || !items.length || !words.length) return;

        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        const ink = getComputedStyle(section).color;
        const from = getComputedStyle(section).getPropertyValue("--reveal-from").trim() || ink;
        gsap.set(words, { color: from });
        gsap.set(items, { force3D: true });

        // Pinned: the headline fills in with the scroll; the pin's progress also turns the ring (read by the ticker)
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
        tl.to(words, { color: ink, duration: 0.12, stagger: 0.07, ease: ease.out }, 0.08);
        const pinST = tl.scrollTrigger!;

        // After the pin: how far the band has scrolled on (read by the ticker for the lag)
        const lagST = ScrollTrigger.create({
          trigger: section,
          start: () => pinST.end,
          end: () => pinST.end + window.innerHeight,
          scrub: 1.2,
          invalidateOnRefresh: true,
        });

        // The ring turns: its own slow turn plus the scroll's share; every mascot keeps its place on the ring
        let t = 0;
        let rx = stage.clientWidth * RX;
        let ry = stage.clientHeight * RY;
        let h = stage.clientHeight;
        const measure = () => {
          rx = stage.clientWidth * RX;
          ry = stage.clientHeight * RY;
          h = stage.clientHeight;
        };
        const tick = (_time: number, dt: number) => {
          t += dt / 1000;
          const turn = (t / REVOLUTION) * Math.PI * 2 + pinST.progress * SCROLL_TURN;
          const lag = lagST.progress;
          items.forEach((el, i) => {
            const { a, k } = base[i];
            gsap.set(el, {
              x: (Math.cos(a + turn) - Math.cos(a)) * rx * k,
              y: (Math.sin(a + turn) - Math.sin(a)) * ry * k + LAG[i % LAG.length] * h * lag,
            });
          });
        };
        const visible = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: () => pinST.end + window.innerHeight * 1.2,
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
          onRefresh: measure,
        });
        if (visible.isActive) gsap.ticker.add(tick);

        // Hover: the mascot leans towards the pointer, on devices with a fine pointer only
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const offs: (() => void)[] = [];
        if (fine) {
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
          gsap.set([items, q("[data-orbit-tilt]")], { clearProps: "transform" });
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
