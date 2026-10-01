"use client";

import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { Columns } from "@/components/brand/Columns";
import { Lockup } from "@/components/brand/Lockup";
import { INTRO_DONE } from "@/components/sections/HeroFilm";
import { introSequence } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { cssPx, ease, gsap, prefersReducedMotion, saveData, setupGsap } from "@/lib/motion";
import styles from "./Preloader.module.css";

const KEY = "preloaderShown";

/**
 * Homepage intro, once per tab (sessionStorage). A Paper overlay with the lockup, the headline and a line of
 * small interior details: the two staggered rows settle into one line, the line spreads, the copy fades, then
 * the hero still grows from a small square in the middle of the viewport to full screen and the hero copy and
 * header fade in. Choreography after stanzza.design, timing per DESIGN §11 (calm, precise eases).
 *
 * Never blocks the content: hidden by CSS without JavaScript, under prefers-reduced-motion / Save-Data, and
 * on repeat visits (inline script in the layout flags <html data-preloader-skip> before first paint; in
 * development that script is left out so the intro plays on every load).
 * The overlay is aria-hidden; the real hero underneath stays in the accessibility tree from the start.
 */
export function Preloader({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      setupGsap();
      const html = document.documentElement;
      const finish = (shown: boolean) => {
        if (shown) {
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* storage unavailable: the intro simply plays again next time */
          }
        }
        html.removeAttribute("data-preloading");
        html.setAttribute("data-preloader-skip", "");
        setDone(true);
        document.dispatchEvent(new CustomEvent(INTRO_DONE));
      };

      if (html.hasAttribute("data-preloader-skip") || prefersReducedMotion() || saveData()) {
        finish(false);
        return;
      }

      const overlay = root.current!;
      const frame = document.querySelector<HTMLElement>("[data-hero-frame]");
      const still = frame?.querySelector<HTMLImageElement>("img") ?? null;
      const copy = document.querySelector<HTMLElement>("[data-hero-copy]");
      const header = document.querySelector<HTMLElement>("[data-header]");
      if (!frame || !still || !copy) {
        finish(false);
        return;
      }

      const q = gsap.utils.selector(overlay);
      const items = q<HTMLElement>("[data-pre-item]");
      const head = q("[data-pre-head]");
      const text = q("[data-pre-text]");
      const content = q("[data-pre-content]");
      const strip = q("[data-pre-strip]");
      const columns = q("[data-pre-columns]");
      const W = window.innerWidth;
      const H = window.innerHeight;
      const n = items.length;
      const mid = (n - 1) / 2;

      // Geometry follows the thumbnail size from the tokens (--intro-thumb), so every viewport gets the same
      // proportions: a tidy two-row brick pattern first, then one line of as many thumbnails as fit.
      const thumb = cssPx(overlay, "--intro-thumb", 64);
      const lineGap = thumb * 1.1; // thumbnail + a hairline of Paper between neighbours
      // As many rows as needed for the pattern to fit 90% of the viewport width: 2 on desktop, 4 on a phone
      const perRow = Math.max(4, Math.min(Math.ceil(n / 2), Math.floor((W * 0.9) / (thumb * 1.5))));
      const brickGap = Math.min(thumb * 1.5, (W * 0.9) / perRow); // spacing inside a row of the brick pattern
      const rows = Math.ceil(n / perRow);
      const rowStep = rows > 2 ? thumb * 1.3 : thumb * 1.5; // vertical distance between rows
      const visible = Math.min(n, Math.max(4, Math.floor((W * 0.86) / lineGap) - (Math.floor((W * 0.86) / lineGap) % 2)));
      // The hero frame starts at exactly one thumbnail's size, so the stacked thumbnails hand over to it seamlessly
      const small = thumb;
      const portrait = H > W;
      const midW = (portrait ? 0.6 : 0.42) * W;
      const midH = portrait ? 0.45 * H : 0.28 * W;
      const paper = getComputedStyle(html).getPropertyValue("--bg").trim() || "#FAFAF7";
      const video = frame.querySelector<HTMLVideoElement>("video");
      const media = video ? [still, video] : [still];

      /* ---------- start states (JS only; the overlay's own parts start hidden in its CSS) ---------- */
      html.setAttribute("data-preloading", "");
      // Brick pattern: items fill the rows in turn, odd rows shifted by half a step, the whole block centred
      items.forEach((el, i) => {
        const row = i % rows;
        const k = Math.floor(i / rows);
        const inRow = Math.ceil((n - row) / rows);
        const x = (k - (inRow - 1) / 2) * brickGap + (row % 2 ? brickGap / 4 : -brickGap / 4);
        // A tall block (phones) sits a little above the centre so it keeps clear of the copy below
        const y = (row - (rows - 1) / 2) * rowStep - (rows > 2 ? rowStep * 0.7 : 0);
        gsap.set(el, { x, y, scale: 0.92 });
      });
      gsap.set([head, text], { opacity: 0, y: 12 });
      gsap.set(frame, { width: small, height: small });
      gsap.set(media, { scale: 1.2 });
      gsap.set(copy, { opacity: 0, y: "3%" });
      if (header) gsap.set(header, { opacity: 0 });
      gsap.set(overlay, { backgroundColor: paper });

      /* ---------- 1 logo and copy · 2 images appear · 3 images join into a line · 4 copy leaves ·
                   5 the line stacks into one square in the centre, which is the film's first frame ·
                   6 that square grows to the full viewport · 7 the film plays (HeroFilm, on intro-done) ---------- */
      const tl = gsap.timeline({ paused: true, onComplete: () => finish(true) });
      tl.to(head, { opacity: 1, y: 0, duration: 0.8, ease: ease.brand }, 0.2)
        .to(text, { opacity: 1, y: 0, duration: 0.8, ease: ease.brand }, 0.35);
      const order = gsap.utils.shuffle(items.map((_, i) => i));
      order.forEach((i, k) => {
        tl.to(items[i], { opacity: 1, scale: 1, duration: 0.5, ease: ease.out }, 1.2 + k * 0.06);
      });
      items.forEach((el, i) => {
        const outer = Math.abs(i - mid) > visible / 2;
        tl.to(el, { x: (i - mid) * lineGap, y: 0, opacity: outer ? 0 : 1, duration: 0.8, ease: ease.precise }, 2.5 + Math.abs(i - mid) * 0.02);
      });
      tl.to(text, { opacity: 0, y: -12, duration: 0.6, ease: ease.brand }, 3.3);
      // Stack: the outer thumbnails slide in first, the centre ones last, all onto the centre square
      items.forEach((el, i) => {
        tl.to(el, { x: 0, duration: 0.7, ease: ease.precise }, 3.6 + (mid - Math.abs(i - mid)) * 0.03);
      });
      tl.add("hero", 4.4)
        .to(overlay, { backgroundColor: "transparent", duration: 0.35, ease: ease.brand }, "hero")
        .to(columns, { opacity: 0, duration: 0.35, ease: ease.brand }, "hero") // the columns leave with the Paper, never over the hero
        .to(strip, { opacity: 0, duration: 0.3, ease: ease.brand }, "hero")
        .to(frame, { width: midW, height: midH, duration: 0.9, ease: ease.precise }, "hero+=0.2")
        .to(media, { scale: 1, duration: 1.7, ease: ease.out }, "hero+=0.3")
        .to(frame, { width: frame.parentElement!.clientWidth, height: frame.parentElement!.clientHeight, duration: 0.8, ease: ease.brand }, "hero+=1.1")
        .to(copy, { opacity: 1, y: "0%", duration: 0.45, ease: ease.brand }, "hero+=1.3")
        .to(content, { opacity: 0, duration: 0.25, ease: ease.brand }, "hero+=1.3")
        .set(frame, { clearProps: "width,height" })
        .set(media, { clearProps: "transform" });
      if (header) tl.to(header, { opacity: 1, duration: 0.6, ease: ease.brand, clearProps: "opacity" }, "hero+=1.3");

      // The first phases run at once; the hero phase waits for the still (and the film's first frame) to be
      // ready, at most 8 s.
      let ready = false;
      let waiting = false;
      const decoded = still.complete ? still.decode().catch(() => undefined) : new Promise<void>((r) => still.addEventListener("load", () => r(), { once: true }));
      const firstFrame =
        video && video.readyState < 2 ? new Promise<void>((r) => video.addEventListener("loadeddata", () => r(), { once: true })) : Promise.resolve();
      const safety = window.setTimeout(() => {
        ready = true;
        if (waiting) tl.play();
      }, 8000);
      Promise.all([decoded, firstFrame]).then(() => {
        ready = true;
        if (waiting) tl.play();
      });
      tl.add(() => {
        if (!ready) {
          waiting = true;
          tl.pause();
        }
      }, "hero-=0.01");
      tl.play(0);

      return () => {
        window.clearTimeout(safety);
        tl.kill();
        html.removeAttribute("data-preloading");
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div ref={root} className={styles.root} data-preloader aria-hidden="true">
      <noscript>
        <style>{`[data-preloader]{display:none !important}`}</style>
      </noscript>
      <Columns tone="paper" data-pre-columns="" />
      <div className={styles.content} data-pre-content>
        <div className={styles.head} data-pre-head>
          <Lockup ariaLabel={c.a11y.home} height={44} />
        </div>
        <div className={styles.text} data-pre-text>
          <p className={styles.title}>{c.hero.headline}</p>
          <p className={styles.lead}>{c.hero.keyMessage}</p>
        </div>
      </div>
      <div className={styles.strip} data-pre-strip>
        {introSequence.map((img) => (
          <div key={img.src} className={styles.item} data-pre-item>
            {/* small decorative thumbnails, one size, no srcset needed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${img.src}-640.webp`} alt="" width={96} height={96} decoding="async" className={styles.thumb} />
          </div>
        ))}
      </div>
    </div>
  );
}
