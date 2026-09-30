"use client";

import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { Lockup } from "@/components/brand/Lockup";
import { introSequence } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { ease, gsap, MQ, prefersReducedMotion, saveData, setupGsap } from "@/lib/motion";
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
      const mobile = !window.matchMedia(MQ.desktop).matches;
      const vw = window.innerWidth / 100;
      const n = items.length;
      const mid = (n - 1) / 2;

      // Geometry (svw units in px). Mobile keeps only the six centre thumbnails visible in the final line.
      const rowGap = (mobile ? 6.25 : 2.6) * vw;
      const startGap = (mobile ? 4 : 3) * vw;
      const lineGap = (mobile ? 12.5 : 4.4) * vw;
      const visible = mobile ? 6 : 10;
      const small = (mobile ? 12 : 4) * vw;
      const midW = (mobile ? 60 : 42) * vw;
      const midH = (mobile ? 45 : 28) * vw;
      const paper = getComputedStyle(html).getPropertyValue("--bg").trim() || "#FAFAF7";
      const rnd = gsap.utils.random;

      /* ---------- start states (JS only; the overlay's own parts start hidden in its CSS) ---------- */
      html.setAttribute("data-preloading", "");
      // Scattered around the centre: two loose rows with a little jitter, so they read as a random cluster
      items.forEach((el, i) => gsap.set(el, { x: (i - mid) * startGap + rnd(-0.8, 0.8) * vw, y: (i % 2 === 0 ? -1 : 1) * rowGap * rnd(0.6, 1.3), scale: 0.9 }));
      gsap.set([head, text], { opacity: 0, y: 12 });
      gsap.set(frame, { width: small, height: small });
      gsap.set(still, { scale: 1.2 });
      gsap.set(copy, { opacity: 0, y: "3%" });
      if (header) gsap.set(header, { opacity: 0 });
      gsap.set(overlay, { backgroundColor: paper });

      /* ---------- 1 logo and copy · 2 images appear · 3 images join into a line · 4 copy leaves · 5 hero ---------- */
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
      tl.to(text, { opacity: 0, y: -12, duration: 0.6, ease: ease.brand }, 3.3)
        .add("hero", 3.8)
        .to(overlay, { backgroundColor: "transparent", duration: 0.5, ease: ease.brand }, "hero")
        .to(strip, { opacity: 0, duration: 0.25, ease: ease.brand }, "hero")
        .to(frame, { width: midW, height: midH, duration: 0.77, ease: ease.precise }, "hero")
        .to(still, { scale: 1, duration: 1.55, ease: ease.out }, "hero+=0.09")
        .to(frame, { width: frame.parentElement!.clientWidth, height: frame.parentElement!.clientHeight, duration: 0.76, ease: ease.brand }, "hero+=0.78")
        .to(copy, { opacity: 1, y: "0%", duration: 0.45, ease: ease.brand }, "hero+=0.86")
        .to(content, { opacity: 0, duration: 0.25, ease: ease.brand }, "hero+=0.88")
        .set(frame, { clearProps: "width,height" })
        .set(still, { clearProps: "transform" });
      if (header) tl.to(header, { opacity: 1, duration: 0.6, ease: ease.brand, clearProps: "opacity" }, "hero+=0.86");

      // The first phases run at once; the hero phase waits for the still to be decoded (at most 4 s more).
      let ready = false;
      let waiting = false;
      const decoded = still.complete ? still.decode().catch(() => undefined) : new Promise<void>((r) => still.addEventListener("load", () => r(), { once: true }));
      const safety = window.setTimeout(() => {
        ready = true;
        if (waiting) tl.play();
      }, 8000);
      decoded.then(() => {
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
