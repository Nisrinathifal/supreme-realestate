"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const PIN = 1.5; // extra viewports the band stays pinned (section ≈ 250vh in all)

/** Four stages of the pinned scroll, as shares of its progress. */
const STAGE = { enter: [0, 0.25], compose: [0.25, 0.55], float: [0.55, 0.75], leave: [0.75, 1] } as const;

/**
 * Per mascot, by its index on the ring: how it enters (diagonal, vertical or horizontal, from outside), where it
 * settles (a small asymmetric shift from the CSS ring), how it floats (a few px, a degree or two) and how it leaves.
 * Values in px are scaled by the stage so the choreography reads the same at any width.
 */
const ROLES = [
  { enter: "diag", settle: { x: -0.02, y: 0.03, r: -2, s: 1.04 }, float: { y: 8, r: 1.5 }, leave: { y: -0.08 } },
  { enter: "vert", settle: { x: 0.015, y: -0.02, r: 1.5, s: 0.97 }, float: { y: -10, r: -1 }, leave: { y: -0.12 } },
  { enter: "horiz", settle: { x: 0.025, y: 0.015, r: 2.5, s: 1.02 }, float: { y: 6, r: 2 }, leave: { y: 0.06 } },
  { enter: "diag", settle: { x: -0.015, y: -0.03, r: -1, s: 1.06 }, float: { y: -7, r: -2 }, leave: { y: 0.1 } },
  { enter: "vert", settle: { x: 0.02, y: 0.02, r: 1, s: 0.95 }, float: { y: 11, r: 1 }, leave: { y: 0.08 } },
  { enter: "horiz", settle: { x: -0.03, y: 0.01, r: -2.5, s: 1.03 }, float: { y: -9, r: 3 }, leave: { y: -0.06 } },
  { enter: "diag", settle: { x: 0.01, y: -0.015, r: 2, s: 0.98 }, float: { y: 5, r: -1.5 }, leave: { y: 0.04 } },
] as const;

/**
 * One scrubbed, pinned timeline (GSAP + ScrollTrigger, transforms only) in four stages, after the reference's
 * "see more work" band: 0–25% the mascots come in from outside the viewport and the headline appears line by line;
 * 25–55% they settle into an asymmetric composition framing the headline; 55–75% they float a few pixels and a degree
 * or two; 75–100% they move outward, some up, some down, as the page carries on into the projects. Start states live
 * here (the CSS ring is the composition reduced motion and no-JS show). On a fine pointer a mascot tilts towards the
 * cursor.
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
        const lines = q<HTMLElement>("[data-orbit-line]");
        if (!section || !stage || !items.length || !lines.length) return;

        const W = () => stage.clientWidth;
        const H = () => stage.clientHeight;
        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        const role = (i: number) => ROLES[i % ROLES.length];
        // Outward unit direction of a mascot from the headline, in stage units
        const out = (i: number) => ({ x: Math.cos(base[i].a), y: Math.sin(base[i].a) });
        // Where it waits before entering: outside the ring in its own direction, partly off the viewport
        const enterX = (i: number) => {
          const d = out(i);
          const r = role(i);
          if (r.enter === "vert") return 0;
          const dx = r.enter === "horiz" ? Math.sign(d.x) || 1 : d.x;
          return dx * W() * 0.2;
        };
        const enterY = (i: number) => {
          const d = out(i);
          const r = role(i);
          if (r.enter === "horiz") return 0;
          const dy = r.enter === "vert" ? Math.sign(d.y) || -1 : d.y;
          return dy * H() * 0.24;
        };
        const settleX = (i: number) => role(i).settle.x * W();
        const settleY = (i: number) => role(i).settle.y * H();
        const leaveX = (i: number) => settleX(i) + out(i).x * W() * RX * 0.5;
        const leaveY = (i: number) => settleY(i) + role(i).leave.y * H() + out(i).y * H() * RY * 0.25;

        // Start states: lines below their clips; mascots outside, dim, slightly turned and smaller
        gsap.set(lines, { yPercent: 110 });
        items.forEach((el, i) => gsap.set(el, { x: () => enterX(i), y: () => enterY(i) }));
        inners.forEach((el, i) => gsap.set(el, { opacity: 0.35, scale: 0.9, rotation: (i % 2 ? 1 : -1) * (4 + (i % 3)) }));

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${window.innerHeight * PIN}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Stage 01: the headline one line per step, the mascots arrive one after another
        lines.forEach((line, i) => tl.to(line, { yPercent: 0, duration: 0.07, ease: ease.out }, 0.02 + i * 0.07));
        items.forEach((el, i) => {
          const at = STAGE.enter[0] + (i % ROLES.length) * 0.012;
          tl.to(el, { x: 0, y: 0, duration: 0.2 }, at);
          tl.to(inners[i], { opacity: 1, scale: 1, rotation: 0, duration: 0.2 }, at);
        });

        // Stage 02: the composition, each mascot its own shift, turn and size
        items.forEach((el, i) => {
          const r = role(i);
          tl.to(el, { x: () => settleX(i), y: () => settleY(i), duration: STAGE.compose[1] - STAGE.compose[0] }, STAGE.compose[0]);
          tl.to(inners[i], { rotation: r.settle.r, scale: r.settle.s, duration: STAGE.compose[1] - STAGE.compose[0] }, STAGE.compose[0]);
        });

        // Stage 03: suspended, a few pixels and a degree or two, scrubbed like everything else
        inners.forEach((el, i) => {
          const r = role(i);
          tl.to(el, { y: r.float.y, rotation: r.settle.r + r.float.r, duration: STAGE.float[1] - STAGE.float[0], ease: "sine.inOut" }, STAGE.float[0]);
        });

        // Stage 04: outward, some up, some down, a little smaller, as the projects follow
        items.forEach((el, i) => {
          tl.to(el, { x: () => leaveX(i), y: () => leaveY(i), duration: STAGE.leave[1] - STAGE.leave[0] }, STAGE.leave[0]);
          tl.to(inners[i], { scale: role(i).settle.s * 0.94, opacity: 0.7, duration: STAGE.leave[1] - STAGE.leave[0] }, STAGE.leave[0]);
        });

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
          tl.scrollTrigger?.kill();
          tl.kill();
          offs.forEach((off) => off());
          // never clearProps "all": the items carry React inline positions
          gsap.set([items, inners, lines, q("[data-orbit-tilt]")], { clearProps: "transform,opacity" });
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
