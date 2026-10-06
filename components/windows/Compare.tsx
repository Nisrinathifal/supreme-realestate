"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { Lang } from "@/content/routes";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import type { PageStrings, WindowProject } from "./types";
import s from "./project.module.css";

type Props = {
  pairs: WindowProject["compare"];
  strings: PageStrings["compare"];
  lang: Lang;
  scroller: RefObject<HTMLDivElement | null>;
};

/**
 * Before and after (project page, 2026-10-06): the finished room under the same room during the works, cut by one
 * vertical seam. The seam's grip is the window frame from the hero (dashed lime ring, centre dot), so the page's two
 * signature controls read as one family. Drag anywhere on the frame (touch keeps vertical scrolling), click to jump,
 * or use the arrow keys on the slider (a real range input, visually hidden, its focus ring drawn on the grip). The
 * first time a pair comes into view the seam sweeps once to show it can move; any touch cancels that. Reduced
 * motion: no sweep, jumps instead of glides. Several pairs: a row of room buttons swaps the pair in the same frame.
 */
export function Compare({ pairs, strings, lang, scroller }: Props) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const state = useRef({ p: 50 });
  const tween = useRef<gsap.core.Animation | null>(null);
  const swept = useRef(false);
  const pair = pairs[index];

  // The one place the seam moves: a CSS number on the frame (no React render per frame) and the input's value
  // (A glide started by the input itself leaves the input's value alone, so held arrow keys keep counting from it)
  const apply = (syncInput = true) => {
    const p = Math.round(state.current.p * 10) / 10;
    frameRef.current?.style.setProperty("--p", String(p));
    if (syncInput && inputRef.current) inputRef.current.value = String(Math.round(p));
  };
  const glide = (to: number, duration = 0.45, fromInput = false) => {
    tween.current?.kill();
    if (prefersReducedMotion()) {
      state.current.p = to;
      return apply(!fromInput);
    }
    tween.current = gsap.to(state.current, { p: to, duration, ease: "power3.out", onUpdate: () => apply(!fromInput) });
  };

  // One sweep the first time the frame is well in view
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || swept.current) return;
        swept.current = true;
        io.disconnect();
        tween.current?.kill();
        tween.current = gsap
          .timeline({ onUpdate: () => apply() })
          .to(state.current, { p: 74, duration: 0.9, ease: "power2.inOut" })
          .to(state.current, { p: 32, duration: 1.1, ease: "power2.inOut" })
          .to(state.current, { p: 50, duration: 0.8, ease: "power2.out" });
      },
      { root: scroller.current, threshold: 0.6 },
    );
    io.observe(frame);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => void tween.current?.kill(), []);

  /* ---------- pointer: press jumps there, drag follows the finger exactly ---------- */
  const at = (clientX: number) => {
    const r = frameRef.current!.getBoundingClientRect();
    return gsap.utils.clamp(0, 100, ((clientX - r.left) / r.width) * 100);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const frame = frameRef.current!;
    frame.setPointerCapture(e.pointerId);
    frame.dataset.dragging = "true";
    glide(at(e.clientX), 0.35);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (frameRef.current?.dataset.dragging !== "true") return;
    tween.current?.kill();
    state.current.p = at(e.clientX);
    apply();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current!;
    frame.dataset.dragging = "false";
    if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
  };

  const choose = (i: number) => {
    if (i === index) return;
    const frame = frameRef.current;
    const swap = () => {
      setIndex(i);
      state.current.p = 50;
      apply();
    };
    if (!frame || prefersReducedMotion()) return swap();
    tween.current?.kill();
    const media = frame.querySelectorAll<HTMLElement>("[data-compare-media]");
    gsap
      .timeline()
      .to(media, { opacity: 0, duration: 0.25, ease: "power1.out" })
      .add(swap)
      .to(media, { opacity: 1, duration: 0.5, ease: "power2.out" }, "+=0.05");
  };

  if (!pair) return null;
  return (
    <div className={s.compare}>
      <div className={s.compareHead}>
        <h3 className={s.bandTitle}>{strings.title}</h3>
        {pairs.length > 1 ? (
          <div className={s.rooms} role="group" aria-label={strings.title}>
            {pairs.map((p, i) => (
              <button key={p.room} type="button" className={s.room} aria-pressed={i === index} onClick={() => choose(i)}>
                {p.room}
              </button>
            ))}
          </div>
        ) : (
          <p className={`t-micro ${s.roomSingle}`}>{pair.room}</p>
        )}
      </div>
      <div
        ref={frameRef}
        className={s.compareFrame}
        data-compare-frame
        style={{ "--p": 50 } as CSSProperties}
        data-dragging="false"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={s.compareMedia} data-compare-media>
          <MediaFrame image={pair.after} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 100vw, 90vw" />
        </div>
        <div className={`${s.compareMedia} ${s.compareBefore}`} data-compare-media>
          <MediaFrame image={pair.before} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 100vw, 90vw" />
        </div>
        <span className={s.tag} data-side="before" aria-hidden="true">
          {strings.before}
        </span>
        <span className={s.tag} data-side="after" aria-hidden="true">
          {strings.after}
        </span>
        <div className={s.seam} aria-hidden="true">
          <span className={s.grip}>
            <CaretLeft size={14} weight="bold" />
            <CaretRight size={14} weight="bold" />
          </span>
        </div>
        <input
          ref={inputRef}
          className={`visually-hidden ${s.range}`}
          type="range"
          min={0}
          max={100}
          step={1}
          defaultValue={50}
          aria-label={pair.slider}
          onInput={(e) => glide(Number(e.currentTarget.value), 0.3, true)}
          onFocus={() => tween.current?.kill()}
        />
      </div>
      <p className={s.hint} aria-hidden="true">
        <CaretLeft size={12} weight="bold" />
        {strings.hint}
        <CaretRight size={12} weight="bold" />
      </p>
    </div>
  );
}
