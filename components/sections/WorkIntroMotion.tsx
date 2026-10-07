"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";

const RX = 0.39; // ring radii as a share of the stage, same as the CSS placement
const RY = 0.37;
const PIN = 1.4; // viewports the band stays pinned
/** The ring's size over the pin (owner, 2026-10-07: no turning): it spreads out first, then draws in close. */
const SPREAD = { wide: 1.2, close: 0.88, turn: 0.38 }; // turn = share of the pin where it stops widening
const RING = { near: 0.68, far: 1 }; // ring size with the pointer on the headline (closer) and at rest
const BLOOM = { ring: 0.06, size: 0.3, title: 0.3 }; // as the band comes in: the ring, the items and the headline start from here
const SMOOTH = 0.08; // per-frame lerp of the driven values (on top of Lenis)

/** How far each mascot lags behind the headline once the band scrolls on (its depth), as a share of the stage. */
const LAG = [0.24, 0.14, 0.28, 0.17, 0.26, 0.12, 0.21];

/**
 * After the reference recordings. As the band comes in, its tone moves from white to Sky mist and the ring blooms out
 * of the centre: the items start small and tight behind the dim headline and open out to the ring, growing, while the
 * headline comes up to its grey. The items are always a ring around the headline. It does not turn (owner,
 * 2026-10-07): while pinned it spreads out wide, then draws in close around the headline, with the scroll; the
 * headline turns to ink one line per scroll step; with the pointer on the headline the ring draws closer still. After the pin each mascot lags behind at its own
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
        if (!section || !stage || !items.length) return;

        const base = items.map((el) => ({ a: (Number(el.dataset.angle) * Math.PI) / 180, k: Number(el.dataset.k) || 1 }));
        const ink = getComputedStyle(section).color;
        const from = getComputedStyle(section).getPropertyValue("--reveal-from").trim() || ink;
        gsap.set(items, { force3D: true });
        gsap.set(inners, { force3D: true, transformOrigin: "50% 50%" });

        // The band tone (--band-tone on body): white as this band slides in, Sky mist once it has arrived, and back to
        // Paper as it scrolls on into the contact band (owner, 2026-10-07: no seam), see toneOut below
        const tokens = getComputedStyle(document.documentElement);
        const tone = gsap.fromTo(
          document.body,
          { "--band-tone": tokens.getPropertyValue("--surface").trim() },
          { "--band-tone": tokens.getPropertyValue("--panel-sky").trim(), ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true } },
        );

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
        // The headline turns to ink one line per scroll step (owner)
        const lines = q<HTMLElement>("[data-orbit-line]");
        gsap.set(lines, { color: from });
        tl.to(lines, { color: ink, duration: 0.16, stagger: 0.2, ease: ease.out }, 0.06);
        const pinST = tl.scrollTrigger!;
        const toneOut = gsap.fromTo(
          document.body,
          { "--band-tone": tokens.getPropertyValue("--panel-sky").trim() },
          {
            "--band-tone": tokens.getPropertyValue("--bg").trim(),
            ease: "none",
            immediateRender: false,
            // fades over the last of the pin, so the contact band below already meets Paper
            scrollTrigger: { trigger: section, start: () => pinST.end - window.innerHeight * 0.6, end: () => pinST.end + window.innerHeight * 0.15, scrub: true, invalidateOnRefresh: true },
          },
        );

        // The bloom: the band's arrival (it slides up over the held steps strip)
        const enterST = ScrollTrigger.create({ trigger: section, start: "top bottom", end: "top top", invalidateOnRefresh: true });
        const title = q<HTMLElement>("[data-orbit-title]")[0];
        // After the pin: how far the band has scrolled on (the lag)
        const lagST = ScrollTrigger.create({ trigger: section, start: () => pinST.end, end: () => pinST.end + window.innerHeight, invalidateOnRefresh: true });

        let rx = 0;
        let ry = 0;
        let h = 0;
        const measure = () => {
          rx = stage.clientWidth * RX;
          ry = stage.clientHeight * RY;
          h = stage.clientHeight;
        };
        measure();
        let spread = 0; // smoothed pin progress, for the spread
        let near = 0; // 1 with the pointer on the headline
        let nearTarget = 0;
        let enter = 0; // smoothed arrival, 0 → 1 as the band slides in
        let lag = 0;
        const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
        const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
        const spreadAt = (p: number) =>
          p < SPREAD.turn ? 1 + (SPREAD.wide - 1) * easeInOut(p / SPREAD.turn) : SPREAD.wide + (SPREAD.close - SPREAD.wide) * easeInOut((p - SPREAD.turn) / (1 - SPREAD.turn));
        const place = () => {
          const bloom = easeOut(enter);
          const ring = (BLOOM.ring + (1 - BLOOM.ring) * bloom) * (RING.far + (RING.near - RING.far) * near) * spreadAt(spread);
          const size = BLOOM.size + (1 - BLOOM.size) * bloom;
          items.forEach((el, i) => {
            const { a, k } = base[i];
            gsap.set(el, {
              x: (Math.cos(a) * ring - Math.cos(a)) * rx * k,
              y: (Math.sin(a) * ring - Math.sin(a)) * ry * k + LAG[i % LAG.length] * h * lag,
              // and fades as it lags, so nothing is left hanging over the About band that comes up under it
              autoAlpha: Math.max(0, 1 - lag * 1.8),
            });
            // a slight lean of its own, each item differently (it no longer goes round)
            gsap.set(inners[i], { scale: size, rotation: 7 * Math.sin(i * 0.9) });
          });
          if (title) gsap.set(title, { opacity: BLOOM.title + (1 - BLOOM.title) * bloom });
        };
        const tick = () => {
          spread += (pinST.progress - spread) * SMOOTH * 1.5;
          near += (nearTarget - near) * SMOOTH;
          enter += (enterST.progress - enter) * SMOOTH * 1.5;
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
            spread = pinST.progress;
            lag = lagST.progress;
            enter = enterST.progress;
            place();
          },
        });
        lag = lagST.progress;
        enter = enterST.progress;
        spread = pinST.progress;
        place();
        if (visible.isActive) gsap.ticker.add(tick);

        const offs: (() => void)[] = [];
        if (fine) {
          // Pointer on the headline: the ring draws closer
          if (title) {
            const enter = () => {
              nearTarget = 1;
            };
            const leave = () => {
              nearTarget = 0;
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
          tone.scrollTrigger?.kill();
          tone.kill();
          toneOut.scrollTrigger?.kill();
          toneOut.kill();
          gsap.set(document.body, { clearProps: "--band-tone" });
          gsap.ticker.remove(tick);
          visible.kill();
          lagST.kill();
          enterST.kill();
          if (title) gsap.set(title, { clearProps: "opacity" });
          tl.scrollTrigger?.kill();
          tl.kill();
          offs.forEach((off) => off());
          // never clearProps "all": the items carry React inline positions
          gsap.set([items, inners, q("[data-orbit-tilt]")], { clearProps: "transform" });
          gsap.set(items, { clearProps: "opacity,visibility" });
          gsap.set(lines, { clearProps: "color" });
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
