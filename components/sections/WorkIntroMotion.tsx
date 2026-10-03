"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const PIN = 1.6; // viewports the band stays pinned
const SPREAD = 0.45; // share of the pinned scroll in which the fan opens into the ring
const HOLD = 0.7; // the ring holds (with a slight drift) until here, then opens outward

/** Per mascot (by index on the ring): its place in the fan, its tilt in the ring, its drift, how far it lags behind. */
const ROLES = [
  { fan: -3, tilt: -4, drift: { x: 0.012, y: -0.014 }, lag: 0.38 },
  { fan: -2, tilt: 3, drift: { x: -0.01, y: 0.012 }, lag: 0.22 },
  { fan: -1, tilt: -2, drift: { x: 0.008, y: 0.016 }, lag: 0.44 },
  { fan: 0, tilt: 5, drift: { x: -0.014, y: -0.01 }, lag: 0.26 },
  { fan: 1, tilt: -3, drift: { x: 0.01, y: 0.014 }, lag: 0.4 },
  { fan: 2, tilt: 2, drift: { x: -0.012, y: -0.016 }, lag: 0.2 },
  { fan: 3, tilt: -5, drift: { x: 0.014, y: 0.01 }, lag: 0.34 },
] as const;

/**
 * After the reference recording, one continuous move scrubbed by the scroll (GSAP + ScrollTrigger, transforms only).
 * Pinned: the mascots start as a small fan above the headline and spread along smooth paths into the ring while the
 * headline fills in from grey to ink word by word; the ring holds with a slight drift; then every mascot opens outward
 * and upward. After the pin, as the band scrolls on, the mascots lag behind the headline (each at its own depth), so
 * the projects arrive through them. Start states live here; reduced motion keeps the CSS ring and the ink headline.
 * On a fine pointer a mascot tilts towards the cursor.
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

        const W = () => stage.clientWidth;
        const H = () => stage.clientHeight;
        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        const role = (i: number) => ROLES[i % ROLES.length];
        // The ring position the CSS gave a mascot, relative to the stage centre
        const ringX = (i: number) => Math.cos(base[i].a) * RX * base[i].k * W();
        const ringY = (i: number) => Math.sin(base[i].a) * RY * base[i].k * H();
        // The fan: a tight arc above the headline; offsets are from the ring position (the CSS place)
        const fanX = (i: number) => role(i).fan * 0.055 * W() - ringX(i);
        const fanY = (i: number) => (-0.3 + Math.abs(role(i).fan) * 0.025) * H() - ringY(i);
        // Opening outward and upward at the end of the pin
        const openX = (i: number) => ringX(i) * 0.32 + role(i).drift.x * W();
        const openY = (i: number) => ringY(i) * 0.28 - 0.1 * H() + role(i).drift.y * H();

        const ink = getComputedStyle(section).color;
        const from = getComputedStyle(section).getPropertyValue("--reveal-from").trim() || ink;

        // Start states: the fan, small and turned; the headline in grey
        items.forEach((el, i) => gsap.set(el, { x: () => fanX(i), y: () => fanY(i), force3D: true }));
        inners.forEach((el, i) => gsap.set(el, { scale: 0.55, rotation: role(i).fan * 9, force3D: true }));
        gsap.set(words, { color: from });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
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

        items.forEach((el, i) => {
          const r = role(i);
          // One path per mascot: fan → ring (settling), ring → ring + drift (held), → open; eases meet without a stop
          tl.to(el, {
            keyframes: [
              { x: 0, y: 0, duration: SPREAD, ease: "power2.out" },
              { x: () => r.drift.x * W(), y: () => r.drift.y * H(), duration: HOLD - SPREAD, ease: "sine.inOut" },
              { x: () => openX(i), y: () => openY(i), duration: 1 - HOLD, ease: "power1.in" },
            ],
          }, 0);
          tl.to(inners[i], {
            keyframes: [
              { scale: 1, rotation: r.tilt, duration: SPREAD, ease: "power2.out" },
              { rotation: r.tilt * 0.6, duration: HOLD - SPREAD, ease: "sine.inOut" },
              { scale: 1.08, rotation: r.tilt * 1.4, duration: 1 - HOLD, ease: "power1.in" },
            ],
          }, 0);
        });
        // The headline fills in word by word while the ring opens
        tl.to(words, { color: ink, duration: 0.12, stagger: 0.07, ease: ease.out }, 0.08);

        // After the pin: the mascots lag behind the headline as the band scrolls away, each at its own depth
        const pinST = tl.scrollTrigger!;
        const lag = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: () => pinST.end,
            end: () => pinST.end + window.innerHeight,
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        });
        items.forEach((el, i) => lag.to(el, { y: () => openY(i) + role(i).lag * H(), duration: 1 }, 0));

        // Hover: the mascot leans towards the pointer, on devices with a fine pointer only
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const offs: (() => void)[] = [];
        if (fine) {
          q<HTMLElement>("[data-orbit-tilt]").forEach((el) => {
            gsap.set(el, { transformPerspective: 700 });
            const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: ease.out });
            const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: ease.out });
            const sc = gsap.quickTo(el, "scale", { duration: 0.6, ease: ease.out });
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              rx(-((e.clientY - r.top) / r.height - 0.5) * 22);
              ry(((e.clientX - r.left) / r.width - 0.5) * 22);
              sc(1.08);
            };
            const leave = () => {
              rx(0);
              ry(0);
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
          lag.scrollTrigger?.kill();
          lag.kill();
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
