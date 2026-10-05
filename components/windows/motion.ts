"use client";

import { ease, gsap } from "@/lib/motion";

type Enter = {
  overlay: HTMLElement;
  /** The chosen window, in viewport pixels, at the moment of the click. */
  rect: DOMRect;
  /** The hero frame, the boat canvas and the hotspot layer: pushed a little away, together, as the interior takes over. */
  exterior: HTMLElement[];
  reduced: boolean;
  onComplete: () => void;
};

/**
 * Through the window (concept 2026-10-05). The interior is a full-viewport image clipped to the window's rectangle,
 * so the part of the room seen "through the glass" is already the real room; the clip then opens to the full
 * viewport while the image settles from 1.3× to 1 around the window's centre, which reads as a camera push.
 * Meanwhile the exterior dims and eases 6% away (on top of whatever zoom the scroll has given it). The copy and
 * the back control arrive last.
 * The timeline is returned paused-and-played so the caller can reverse it to leave the same way.
 * Reduced motion: a plain fade in the same order.
 */
export function enterTimeline({ overlay, rect, exterior, reduced, onComplete }: Enter) {
  const q = gsap.utils.selector(overlay);
  const dimmer = q("[data-dimmer]");
  const stage = q("[data-stage]");
  const image = q("[data-image]");
  const ui = [...q("[data-scroller]"), ...q("[data-back]")];
  const tl = gsap.timeline({ paused: true, onComplete });
  gsap.set(overlay, { autoAlpha: 1 });

  if (reduced) {
    gsap.set([dimmer, stage, ...ui], { autoAlpha: 0 });
    gsap.set(stage, { clipPath: "none" });
    tl.to(dimmer, { autoAlpha: 1, duration: 0.35, ease: ease.out })
      .to(stage, { autoAlpha: 1, duration: 0.5, ease: ease.out }, 0.1)
      .to(ui, { autoAlpha: 1, duration: 0.4, ease: ease.out }, 0.45);
    return tl.play();
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const origin = `${((rect.left + rect.width / 2) / vw) * 100}% ${((rect.top + rect.height / 2) / vh) * 100}%`;
  const pane = `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round 2px)`;
  gsap.set(dimmer, { opacity: 0 });
  gsap.set(stage, { clipPath: pane, autoAlpha: 1 });
  gsap.set(image, { scale: 1.3, transformOrigin: origin });
  gsap.set(ui, { autoAlpha: 0, y: 14 });
  // Already zoomed by the scroll: keep its origin, or the frame would jump; otherwise push from the window
  const base = Number(gsap.getProperty(exterior[0], "scale")) || 1;
  if (base === 1) gsap.set(exterior, { transformOrigin: origin });

  tl.to(dimmer, { opacity: 1, duration: 0.7, ease: ease.out }, 0.1)
    .to(exterior, { scale: base * 1.06, duration: 1.4, ease: "power3.inOut" }, 0)
    .to(stage, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1.25, ease: "power3.inOut" }, 0.25)
    .to(image, { scale: 1, duration: 1.6, ease: "power3.inOut" }, 0.2)
    .to(ui, { autoAlpha: 1, y: 0, duration: 0.6, ease: ease.out, stagger: 0.05 }, 1.15);
  return tl.play();
}

/** The preview beside a lifted window: a short rise, no bounce. */
export function previewIn(el: HTMLElement, reduced: boolean) {
  if (reduced) return gsap.to(el, { autoAlpha: 1, duration: 0.25, overwrite: true });
  return gsap.fromTo(el, { autoAlpha: 0, y: 10, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: ease.out, overwrite: true });
}

export function previewOut(el: HTMLElement, reduced: boolean) {
  return gsap.to(el, { autoAlpha: 0, y: reduced ? 0 : 6, duration: 0.28, ease: ease.out, overwrite: true });
}

/** Changing project inside the overlay: the stage dips out, the image swaps, the stage returns. */
export function swapStage(stage: HTMLElement, swap: () => void, reduced: boolean) {
  const d = reduced ? 0.2 : 0.35;
  return gsap
    .timeline()
    .to(stage, { opacity: 0, duration: d, ease: ease.out })
    .add(swap)
    .to(stage, { opacity: 1, duration: d * 1.4, ease: ease.out });
}
