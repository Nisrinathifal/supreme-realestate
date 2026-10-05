"use client";

import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import type { FilmSubject } from "@/content/media";
import { ease, gsap, prefersReducedMotion, saveData, setupGsap } from "@/lib/motion";
import { INTRO_DONE } from "./HeroFilm";
import styles from "./Hero.module.css";

type Props = { subject: FilmSubject };

/** Film size the subject was traced in. */
const FILM_W = 1920;
const FILM_H = 1080;
/** The boat's outline is grown by this many CSS px, so its edge never lets a letter show through. */
const GROW = 1.5;
/** If the film has not started this long after the intro, or stays paused this long, the copy simply appears. */
const STALL_MS = 2500;
/** The key message follows the bow a little later, as a fraction of the drawn film width. */
const LEAD_LAG = 0.05;

/** Colour stops of a CSS linear-gradient token, e.g. --media-scrim: [[colour, 0..1], …]. */
function gradientStops(value: string): [string, number][] {
  return Array.from(value.matchAll(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})\s+([\d.]+)%/gi), (m) => [m[1], parseFloat(m[2]) / 100]);
}

/**
 * Concept 3: the headline stands on the waterline behind the passing boat. The boat is redrawn from the playing
 * film onto a canvas above the headline, clipped to its traced outline at its offset on the current frame
 * (scripts/film-matte.swift), with the bottom scrim baked in so it matches the film around it. On the first
 * crossing the letters (and the key message's words) rise into place as the bow passes them.
 * Reduced motion and Save-Data: no film, so neither runs and the copy stays in full view over the still.
 */
export function HeroBoat({ subject }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || saveData()) return;
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>("[data-hero]");
    const video = hero?.querySelector<HTMLVideoElement>("video");
    const title = hero?.querySelector<HTMLElement>("[data-hero-title]");
    const lead = hero?.querySelector<HTMLElement>("[data-hero-lead]");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !hero || !video || !title || !lead || !ctx) return;
    setupGsap();
    gsap.registerPlugin(SplitText);

    const stops = gradientStops(getComputedStyle(hero).getPropertyValue("--media-scrim"));
    let cancelled = false;
    let live = document.documentElement.hasAttribute("data-preloader-skip"); // intro over: the frame fills the hero
    let frameCb = 0;
    let raf = 0;
    let stall = 0;
    let splits: SplitText[] = [];
    let pending: { el: HTMLElement; lag: number; x: number | null }[] = [];

    /* ---------- geometry: the film covers the hero, anchored top centre ---------- */
    const geometry = () => {
      const r = hero.getBoundingClientRect();
      const s = Math.max(r.width / FILM_W, r.height / FILM_H);
      return { r, s, left: (r.width - FILM_W * s) / 2 };
    };
    const offsetAt = (time: number) => subject.frames[Math.min(subject.frames.length - 1, Math.max(0, Math.round(time * subject.fps)))];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { r } = geometry();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      pending.forEach((p) => (p.x = null));
    };

    /* ---------- the boat over the headline ---------- */
    const draw = (time: number) => {
      const dpr = canvas.width / Math.max(1, hero.clientWidth);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const off = offsetAt(time);
      if (!live || !off || video.readyState < 2) return;
      const { r, s, left } = geometry();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const path = new Path2D();
      subject.poly.forEach(([x, y], i) => {
        const px = left + (x + off[0]) * s;
        const py = (y + off[1]) * s;
        if (i) path.lineTo(px, py);
        else path.moveTo(px, py);
      });
      path.closePath();
      const pattern = ctx.createPattern(video, "no-repeat");
      if (!pattern) return;
      // The source may be the smaller mobile encode: scale its pixels to film pixels first
      const k = (s * FILM_W) / (video.videoWidth || FILM_W);
      pattern.setTransform(new DOMMatrix([k, 0, 0, k, left, 0]));
      ctx.fillStyle = pattern;
      ctx.strokeStyle = pattern;
      ctx.lineJoin = "round";
      ctx.lineWidth = GROW * 2;
      ctx.fill(path);
      ctx.stroke(path);
      // The bottom scrim over the boat only, as the CSS scrim lies over the film around it
      if (stops.length) {
        const g = ctx.createLinearGradient(0, r.height, 0, 0);
        stops.forEach(([c, at]) => g.addColorStop(at, c));
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, r.width, r.height);
        ctx.globalCompositeOperation = "source-over";
      }
    };

    /* ---------- the first crossing brings the copy in ---------- */
    const show = (els: HTMLElement[], stagger = 0) =>
      gsap.to(els, { opacity: 1, yPercent: 0, duration: 0.7, ease: ease.brand, stagger, overwrite: true });
    const finish = () => {
      window.clearTimeout(stall);
      if (pending.length) show(pending.map((p) => p.el), 0.015);
      pending = [];
    };
    const reveal = (time: number) => {
      if (!pending.length) return;
      const off = offsetAt(time);
      // The first crossing is over (the boat has left the frame): whatever is left simply appears
      if (!off) return finish();
      const { r, s, left } = geometry();
      const bow = r.left + left + (Math.max(...subject.poly.map((p) => p[0])) + off[0]) * s;
      const passed: HTMLElement[] = [];
      pending = pending.filter((p) => {
        if (p.x === null) {
          const b = p.el.getBoundingClientRect();
          p.x = b.left + b.width / 2;
        }
        if (p.x + p.lag * FILM_W * s > bow) return true;
        passed.push(p.el);
        return false;
      });
      if (passed.length) show(passed);
    };

    /* ---------- per presented frame ---------- */
    const hasFrameCb = "requestVideoFrameCallback" in video;
    const onFrame = (_now: number, meta?: VideoFrameCallbackMetadata) => {
      const time = meta ? meta.mediaTime : video.currentTime;
      draw(time);
      reveal(time);
      if (hasFrameCb) frameCb = video.requestVideoFrameCallback(onFrame);
      else raf = requestAnimationFrame((t) => onFrame(t));
    };
    const redraw = () => draw(video.currentTime);
    const watch = () => {
      window.clearTimeout(stall);
      stall = window.setTimeout(() => {
        if (video.paused) finish();
      }, STALL_MS);
    };
    const onIntroDone = () => {
      live = true;
      resize();
      redraw();
      watch();
    };
    // (Re)arm the frame callback when playback starts: a source swap (HeroFilm picks one on mount) drops it
    const onPlaying = () => {
      window.clearTimeout(stall);
      if (!hasFrameCb) return;
      video.cancelVideoFrameCallback(frameCb);
      frameCb = video.requestVideoFrameCallback(onFrame);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("resize", redraw);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", watch);
    video.addEventListener("seeked", redraw);
    if (live) watch();
    else document.addEventListener(INTRO_DONE, onIntroDone, { once: true });
    if (hasFrameCb) frameCb = video.requestVideoFrameCallback(onFrame);
    else raf = requestAnimationFrame((t) => onFrame(t));

    // Split once the fonts are in, and only while the first crossing is still ahead
    document.fonts.ready.then(() => {
      if (cancelled || video.currentTime > 0.5) return;
      splits = [new SplitText(title, { type: "words,chars" }), new SplitText(lead, { type: "words" })];
      pending = [
        ...(splits[0].chars as HTMLElement[]).map((el) => ({ el, lag: 0, x: null })),
        ...(splits[1].words as HTMLElement[]).map((el) => ({ el, lag: LEAD_LAG, x: null })),
      ];
      gsap.set(pending.map((p) => p.el), { opacity: 0, yPercent: 40 });
    });

    return () => {
      cancelled = true;
      if (hasFrameCb) video.cancelVideoFrameCallback(frameCb);
      cancelAnimationFrame(raf);
      window.clearTimeout(stall);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", redraw);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", watch);
      video.removeEventListener("seeked", redraw);
      document.removeEventListener(INTRO_DONE, onIntroDone);
      gsap.killTweensOf(pending.map((p) => p.el));
      splits.forEach((sp) => sp.revert());
    };
  }, [subject]);

  return <canvas ref={canvasRef} className={styles.boat} aria-hidden="true" />;
}
