"use client";

import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import type { FilmSubject } from "@/content/media";
import { ease, gsap, prefersReducedMotion, saveData, setupGsap } from "@/lib/motion";
import { HEADLINE_IN, HERO_LIVE } from "./HeroFilm";
import styles from "./Hero.module.css";

type Props = { subject: FilmSubject };

/** Film size the subject was traced in. */
const FILM_W = 1920;
const FILM_H = 1080;
/** The boat's outline is grown by this many CSS px, so its edge never lets a letter show through. */
const GROW = 1.5;
/** If the film has not started this long after the intro, or stays paused this long, the copy simply appears. */
const STALL_MS = 2500;
/** The wake: letters stay hidden this far behind the stern, then fade in over this length (fractions of the hero width,
 *  so the trail reads the same on a phone, where the film is far wider than the screen). */
const WAKE_GAP = 0.03;
const WAKE_FADE = 0.16;
/** The key message trails a little further behind. */
const LEAD_LAG = 0.05;
/** Every crossing: how far (percent of their height) the letters ride up on the bow wave before settling in the wake. */
const RIPPLE = 7;

/** Colour stops of a CSS linear-gradient token, e.g. --media-scrim: [[colour, 0..1], …]. */
function gradientStops(value: string): [string, number][] {
  return Array.from(value.matchAll(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})\s+([\d.]+)%/gi), (m) => [m[1], parseFloat(m[2]) / 100]);
}

/**
 * Concept 3: the headline stands on the waterline behind the passing boat. The boat is redrawn from the playing
 * film onto a canvas above the headline, clipped to its traced outline at its offset on the current frame
 * (scripts/film-matte.swift), with the bottom scrim baked in so it matches the film around it. On the first
 * crossing the letters (and the key message's words) surface in the boat's wake: a gap behind the stern, then a
 * fade over WAKE_FADE, so the newest letters are faint and the ones further back solid, like a trail. On every
 * crossing after that the letters ride the water: lifted ahead of the bow, held under the hull, then a damped bob
 * in the wake, so the boat displaces the headline instead of merely covering it.
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
    if (!canvas || !hero || !video || !title || !ctx) return;
    setupGsap();
    gsap.registerPlugin(SplitText);

    const stops = gradientStops(getComputedStyle(hero).getPropertyValue("--media-scrim"));
    let cancelled = false;
    let live = document.documentElement.hasAttribute("data-hero-live"); // the film runs (HeroFilm)
    let announced = false; // the headline has started to come in
    const announce = () => {
      if (announced) return;
      announced = true;
      document.dispatchEvent(new CustomEvent(HEADLINE_IN));
    };
    let frameCb = 0;
    let raf = 0;
    let stall = 0;
    let splits: SplitText[] = [];
    type Letter = { el: HTMLElement; x: number | null; rise: number; applied: number };
    let letters: Letter[] = [];
    let pending: { el: HTMLElement; lag: number; x: number | null; letter?: Letter }[] = [];

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
      letters.forEach((l) => (l.x = null));
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
    const finish = () => {
      window.clearTimeout(stall);
      announce();
      if (pending.length) gsap.to(pending.map((p) => p.el), { opacity: 1, duration: 0.7, ease: ease.brand, stagger: 0.015, overwrite: "auto" });
      pending.forEach((p) => {
        if (p.letter) p.letter.rise = 0;
        else gsap.to(p.el, { yPercent: 0, duration: 0.7, ease: ease.brand });
      });
      pending = [];
    };
    const stern = Math.min(...subject.poly.map((p) => p[0]));
    const bowX = Math.max(...subject.poly.map((p) => p[0]));
    const reveal = (time: number) => {
      if (!pending.length) return;
      const off = offsetAt(time);
      // The first crossing is over (the boat has left the frame): whatever is left simply appears
      if (!off) return finish();
      const { r, s, left } = geometry();
      const tail = r.left + left + (stern + off[0]) * s - WAKE_GAP * r.width;
      const fade = WAKE_FADE * r.width;
      pending = pending.filter((p) => {
        if (p.x === null) {
          const b = p.el.getBoundingClientRect();
          p.x = b.left + b.width / 2;
        }
        const d = (tail - p.x - p.lag * r.width) / fade;
        if (d <= 0) return true;
        const t = d >= 1 ? 1 : d * d * (3 - 2 * d); // smoothstep: soft at both ends of the wake
        announce();
        if (p.letter) {
          gsap.set(p.el, { opacity: t });
          p.letter.rise = 30 * (1 - t); // the ripple applies it, with the wave
        } else gsap.set(p.el, { opacity: t, yPercent: 30 * (1 - t) });
        return t < 1;
      });
    };

    /* ---------- every crossing: the headline rides the water ---------- */
    const ripple = (time: number) => {
      if (!letters.length) return;
      const off = offsetAt(time);
      const { r, s, left } = geometry();
      const bow = off ? r.left + left + (bowX + off[0]) * s : -Infinity;
      const tail = off ? r.left + left + (stern + off[0]) * s : -Infinity;
      const len = (bowX - stern) * s;
      letters.forEach((l) => {
        if (l.x === null) {
          const b = l.el.getBoundingClientRect();
          l.x = b.left + b.width / 2;
        }
        let wave = 0;
        if (off) {
          if (l.x > bow) {
            // Ahead of the bow: lifted as the bow wave reaches it
            const u = (l.x - bow) / (len * 0.35);
            if (u < 1) wave = -RIPPLE * (1 - u * u * (3 - 2 * u));
          } else if (l.x >= tail) {
            wave = -RIPPLE; // under the hull
          } else {
            // In the wake: a damped bob that dies out about one boat-length behind
            const u = (tail - l.x) / (len * 1.1);
            if (u < 1.4) wave = -RIPPLE * Math.cos(1.5 * Math.PI * u) * Math.exp(-1.6 * u) * (u > 1 ? (1.4 - u) / 0.4 : 1);
          }
        }
        const y = l.rise + wave;
        if (Math.abs(y - l.applied) > 0.05) {
          l.applied = y;
          gsap.set(l.el, { yPercent: y });
        }
      });
    };

    /* ---------- per presented frame ---------- */
    const hasFrameCb = "requestVideoFrameCallback" in video;
    const onFrame = (_now: number, meta?: VideoFrameCallbackMetadata) => {
      const time = meta ? meta.mediaTime : video.currentTime;
      draw(time);
      reveal(time);
      ripple(time);
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
    const onLive = () => {
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
    else document.addEventListener(HERO_LIVE, onLive, { once: true });
    if (hasFrameCb) frameCb = video.requestVideoFrameCallback(onFrame);
    else raf = requestAnimationFrame((t) => onFrame(t));

    // Split once the fonts are in, and only while the first crossing is still ahead
    document.fonts.ready.then(() => {
      if (cancelled || video.currentTime > 0.5) return;
      splits = [new SplitText(title, { type: "words,chars" }), ...(lead ? [new SplitText(lead, { type: "words" })] : [])];
      letters = (splits[0].chars as HTMLElement[]).map((el) => ({ el, x: null, rise: 30, applied: 30 }));
      pending = [
        ...letters.map((letter) => ({ el: letter.el, lag: 0, x: null, letter })),
        ...((splits[1]?.words as HTMLElement[] | undefined) ?? []).map((el) => ({ el, lag: LEAD_LAG, x: null })),
      ];
      gsap.set(pending.map((p) => p.el), { opacity: 0, yPercent: 30 });
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
      document.removeEventListener(HERO_LIVE, onLive);
      gsap.killTweensOf(pending.map((p) => p.el));
      splits.forEach((sp) => sp.revert());
    };
  }, [subject]);

  return <canvas ref={canvasRef} className={styles.boat} aria-hidden="true" />;
}
