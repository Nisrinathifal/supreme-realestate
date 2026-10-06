"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { Lang } from "@/content/routes";
import { cssPx, gsap, prefersReducedMotion } from "@/lib/motion";
import type { PageStrings, WindowProject } from "./types";
import s from "./project.module.css";

type Props = {
  items: WindowProject["gallery"];
  /** The photo it opens on. */
  start: number;
  /** The gallery button of a photo: the photo grows out of it and goes back into it. */
  tileFor: (i: number) => HTMLElement | null;
  onClose: () => void;
  strings: PageStrings["gallery"];
  lang: Lang;
};

const SWIPE = 48;

/**
 * Photo viewer (project page, 2026-10-06). Portalled to <body> above the project overlay (the overlay's scroller
 * carries a transform, which would trap a fixed child). The photo grows out of its tile in the grid (a FLIP with a
 * clip, so the crop of the tile opens to the whole photograph) and goes back into the tile of the photo you are on,
 * scrolled into view first behind the veil. Arrows, the arrow keys or a swipe step through the set; Escape, the close
 * button or a click on the veil closes. Focus stays inside while open and goes back to the tile. The neighbours load
 * ahead. Reduced motion: fades.
 */
export function Lightbox({ items, start, tileFor, onClose, strings, lang }: Props) {
  const [current, setCurrent] = useState(start);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const down = useRef<{ x: number; y: number } | null>(null);
  const n = items.length;
  const item = items[current];

  // The frame placed over the tile, its crop matched by a clip: the start (and end) state of the FLIP
  const fromTile = useCallback(
    (i: number) => {
      const frame = frameRef.current;
      const tile = tileFor(i);
      if (!frame || !tile) return null;
      const f = frame.getBoundingClientRect();
      const t = tile.getBoundingClientRect();
      if (t.bottom < 0 || t.top > window.innerHeight || !t.width) return null;
      const k = Math.max(t.width / f.width, t.height / f.height);
      const ix = Math.max(0, (f.width - t.width / k) / 2);
      const iy = Math.max(0, (f.height - t.height / k) / 2);
      const r = cssPx(tile, "--tile-r", 18) / k;
      return {
        x: t.left + t.width / 2 - (f.left + f.width / 2),
        y: t.top + t.height / 2 - (f.top + f.height / 2),
        scale: k,
        clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round ${r}px)`,
      };
    },
    [tileFor],
  );

  const setTileHidden = (i: number, hidden: boolean) => {
    const tile = tileFor(i);
    if (tile) tile.style.visibility = hidden ? "hidden" : "";
  };

  /* ---------- open: the photo leaves its tile ---------- */
  useLayoutEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame) return;
    const q = gsap.utils.selector(root);
    const veil = q("[data-lb-veil]");
    const chrome = q("[data-lb-chrome]");
    closeRef.current?.focus({ preventScroll: true });
    if (prefersReducedMotion()) {
      gsap.fromTo([...veil, frame, ...chrome], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      return;
    }
    const from = fromTile(start);
    setTileHidden(start, true);
    busy.current = true;
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        gsap.set(frame, { clearProps: "transform,clipPath" });
      },
    });
    tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0);
    if (from) tl.fromTo(frame, from, { x: 0, y: 0, scale: 1, clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.8, ease: "power3.inOut" }, 0);
    else tl.fromTo(frame, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out" }, 0);
    tl.fromTo(chrome, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power3.out" }, 0.45);
    return () => void tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- close: back into the tile of the photo on screen ---------- */
  const close = useCallback(() => {
    if (busy.current) return;
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame) return onClose();
    busy.current = true;
    const q = gsap.utils.selector(root);
    const tile = tileFor(current);
    const done = () => {
      setTileHidden(current, false);
      onClose();
      tile?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) {
      gsap.to(root, { autoAlpha: 0, duration: 0.25, onComplete: done });
      return;
    }
    tile?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    const to = fromTile(current);
    setTileHidden(current, true);
    const tl = gsap.timeline({ onComplete: done });
    tl.to(q("[data-lb-chrome]"), { autoAlpha: 0, duration: 0.2 }, 0);
    if (to) tl.to(frame, { ...to, duration: 0.7, ease: "power3.inOut" }, 0.05);
    else tl.to(frame, { autoAlpha: 0, scale: 0.96, duration: 0.35, ease: "power2.in" }, 0.05);
    tl.to(q("[data-lb-veil]"), { autoAlpha: 0, duration: 0.45, ease: "power2.inOut" }, to ? 0.3 : 0.1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, fromTile, onClose, tileFor]);

  /* ---------- step: the photo slides out, the next slides in from the side it came from ---------- */
  const step = useCallback(
    (dir: 1 | -1) => {
      if (busy.current || n < 2) return;
      const frame = frameRef.current;
      const next = (current + dir + n) % n;
      const swap = () => {
        setTileHidden(current, false);
        setTileHidden(next, true);
        setCurrent(next);
      };
      if (!frame || prefersReducedMotion()) return swap();
      busy.current = true;
      gsap
        .timeline({ onComplete: () => void (busy.current = false) })
        .to(frame, { x: -dir * 56, autoAlpha: 0, duration: 0.22, ease: "power2.in" })
        .add(swap)
        .fromTo(frame, { x: dir * 56, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "+=0.02");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, n],
  );

  /* ---------- keys (captured before the overlay's own Escape), focus kept inside ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Tab") {
        const focusable = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close, step]);

  useEffect(
    () => () => {
      for (let i = 0; i < n; i++) setTileHidden(i, false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!item) return null;
  const ratio = item.image.width / item.image.height;
  const neighbours = n > 1 ? [items[(current + 1) % n], items[(current - 1 + n) % n]] : [];
  return createPortal(
    <div
      ref={rootRef}
      className={s.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={strings.title}
      data-lenis-prevent
      onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const d = down.current;
        down.current = null;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - d.y)) step(dx < 0 ? 1 : -1);
        else if (Math.abs(dx) < 6 && (e.target as HTMLElement).hasAttribute("data-lb-backdrop")) close();
      }}
    >
      <div className={s.lbVeil} data-lb-veil aria-hidden="true" />
      <div className={s.lbStage} data-lb-backdrop>
        <div ref={frameRef} className={s.lbFrame} style={{ "--ratio": ratio } as CSSProperties}>
          <MediaFrame key={item.image.src} image={item.image} ratio="fill" lang={lang} radius="none" sizes="92vw" priority />
        </div>
      </div>
      <div className={s.lbBar} data-lb-chrome>
        <p className={s.lbCount} aria-live="polite">
          {current + 1} / {n}
        </p>
        <button ref={closeRef} type="button" className={s.lbButton} onClick={close} aria-label={strings.close}>
          <X size={20} weight="light" aria-hidden="true" />
        </button>
      </div>
      {n > 1 ? (
        <>
          <button type="button" className={`${s.lbButton} ${s.lbPrev}`} data-lb-chrome onClick={() => step(-1)} aria-label={strings.prev}>
            <ArrowLeft size={20} weight="light" aria-hidden="true" />
          </button>
          <button type="button" className={`${s.lbButton} ${s.lbNext}`} data-lb-chrome onClick={() => step(1)} aria-label={strings.next}>
            <ArrowRight size={20} weight="light" aria-hidden="true" />
          </button>
        </>
      ) : null}
      <div className={s.lbWarm} aria-hidden="true">
        {neighbours.map((nb) => (
          <MediaFrame key={nb.image.src} image={nb.image} ratio="fill" lang={lang} radius="none" sizes="92vw" decorative priority />
        ))}
      </div>
    </div>,
    document.body,
  );
}
