"use client";

import { useGSAP } from "@gsap/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HEADER_THEME } from "@/components/layout/Header";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { buildSceneTimeline, createSceneState, FINALE, STAGES } from "@/lib/supreme/sceneTimeline";
import { ease, gsap, MQ, saveData, setupGsap } from "@/lib/motion";
import { Elevation, Finale, type StageCopy, TransformationTimeline } from "./TransformationTimeline";
import styles from "./SupremeHero.module.css";

// The WebGL scene (three + R3F) is loaded only when it will run: motion on, WebGL available, no Save-Data. Every
// screen size gets it; phones and tablets in a portrait layout (stage text under the model) and a lighter scene.
const ArchitecturalScene = dynamic(() => import("./ArchitecturalScene"), { ssr: false });

const LIVE = MQ.full;
const LITE = "(max-width: 980px), (pointer: coarse)";
const END = 1.12; // the transformation runs 0–1; the rest is the hold and the darkening into the letter band
const SCROLL = 9; // viewports of scroll for the whole run

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/**
 * The About band as a procedural 3D model (SCENE-3D.md; owner, 2026-10-07, after illoca.unseen.co): the promise as a
 * large title over the model, then, pinned, one existing building on a developer's worktable becoming eight homes,
 * scrubbed by the scroll (GSAP + ScrollTrigger, Lenis smoothing): one building → potential → eight apartments →
 * eight homes → one property, eight homes; the stage text on alternate sides, the mascot alongside, the closing line
 * over the pulled-back model, and at the end the view darkens into the letter band below.
 * Server and fallback (reduced motion, no WebGL, Save-Data, no JS) render the title, a procedural SVG elevation, the
 * five stages as a list and the closing line.
 */
export function SupremeHero({ label, title, stages, close, finale }: { label: string; title: string; stages: StageCopy[]; close: string; finale: { title: string; body: string } }) {
  const root = useRef<HTMLElement>(null);
  const [state] = useState(createSceneState); // one mutable state object, tweened by GSAP, read by the scene
  const [live, setLive] = useState(false);
  const [lite, setLite] = useState(false);
  const [mounted, setMounted] = useState(false);
  const invalidate = useRef<() => void>(() => undefined);

  useEffect(() => {
    const mq = window.matchMedia(LIVE);
    const check = () => {
      setLive(mq.matches && hasWebGL() && !saveData());
      setLite(window.matchMedia(LITE).matches);
    };
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  // The scene (its chunk, the WebGL context, the shaders) is set up off the page's start: when the browser is idle
  // well after load, or once the band is within a viewport, whichever comes first; it stays mounted from then on
  useEffect(() => {
    if (!live || !root.current || mounted) return;
    const mount = () => setMounted(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && mount(), { rootMargin: "100% 0px" });
    io.observe(root.current);
    // not in the page's first seconds (the hero's film and headline are running then): six seconds after load, then idle
    let idle = 0;
    const timer = window.setTimeout(() => {
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(mount, { timeout: 4000 }) : window.setTimeout(mount, 0);
    }, 6000);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [live, mounted]);

  useGSAP(
    () => {
      if (!live) return;
      setupGsap();
      const section = root.current!;
      const q = gsap.utils.selector(section);
      const stage = q<HTMLElement>("[data-film-stage]")[0];
      const head = q<HTMLElement>("[data-film-head]")[0];
      const view = q<HTMLElement>("[data-film-view]")[0];
      const dusk = q<HTMLElement>("[data-film-dusk]")[0];
      const words = q<HTMLElement>("[data-film-word]");
      const texts = q<HTMLElement>("[data-film-stage-text]");
      const dots = q<HTMLElement>("[data-film-dot]");
      const end = q<HTMLElement>("[data-film-finale]")[0];
      const endLines = q<HTMLElement>("[data-film-finale-line]");
      const endBody = q<HTMLElement>("[data-film-finale-body]");
      if (!stage || !head || !view || !dusk || !end) return;
      const header = (dark: boolean) => document.dispatchEvent(new CustomEvent(HEADER_THEME, { detail: { key: "about", dark } }));

      // the model fills the band from the start (owner, 2026-10-08, after illoca); the title sits over it and lifts away
      gsap.set(words, { yPercent: 110 });
      gsap.set(texts, { opacity: 0, y: 36 });
      gsap.set(dusk, { opacity: 0 });
      gsap.set(end, { autoAlpha: 0 });
      gsap.set(endLines, { yPercent: 110 });
      gsap.set(endBody, { opacity: 0, y: 20 });

      const arrive = gsap.to(words, {
        yPercent: 0,
        ease: ease.out,
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 15%", scrub: 0.8, invalidateOnRefresh: true },
      });

      let dark = false;
      let reached = -1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * SCROLL}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            invalidate.current(); // one frame of the scene for this scroll position
            const t = tl.time();
            const d = t > END - 0.06;
            if (d !== dark) header((dark = d));
            const r = STAGES.reduce<number>((acc, s, i) => (state.progress >= s - 0.04 ? i : acc), 0);
            if (r !== reached) {
              reached = r;
              dots.forEach((dot, i) => dot.toggleAttribute("data-active", i === r));
            }
          },
          onLeaveBack: () => dark && header((dark = false)),
          onLeave: () => dark && header((dark = false)), // past the band: the letter band below has the bar from here
        },
      });

      // the scene: progress (camera) and every state, over 0–1
      tl.to(state, { progress: 1, duration: 1, ease: "none" }, 0);
      buildSceneTimeline(state, tl);
      // the title lifts away as the view opens
      tl.to(head, { y: () => -window.innerHeight * 0.3, opacity: 0, duration: 0.06, ease: "power2.in" }, 0.005);
      // each stage's text, in at its state, out before the next
      texts.forEach((el, i) => {
        // in just before its state, out just before the next one's comes in (on phones they share one spot)
        const at = i === 0 ? 0.04 : STAGES[i] - 0.03;
        tl.to(el, { opacity: 1, y: 0, duration: 0.035, ease: "power2.out" }, at);
        const out = i < texts.length - 1 ? STAGES[i + 1] - 0.06 : FINALE - 0.025;
        tl.to(el, { opacity: 0, y: -24, duration: 0.03, ease: "power2.in" }, out);
      });
      // the closing line over the pulled-back building
      tl.to(end, { autoAlpha: 1, duration: 0.02, ease: "none" }, FINALE - 0.005);
      tl.to(endLines, { yPercent: 0, duration: 0.04, ease: "power3.out", stagger: 0.012 }, FINALE).to(endBody, { opacity: 1, y: 0, duration: 0.035, ease: "power2.out" }, FINALE + 0.025);
      // the end: a hold on the finished building, then the darkening into the letter band
      tl.to(dusk, { opacity: 1, duration: 0.07, ease: "none" }, END - 0.08).to({}, { duration: 0.01 }, END - 0.01);

      return () => {
        arrive.scrollTrigger?.kill();
        arrive.kill();
        tl.scrollTrigger?.kill();
        tl.kill();
        if (dark) header(false);
        gsap.set([...words, head, dusk, ...texts, end, ...endLines, ...endBody], { clearProps: "transform,opacity,visibility" });
        dots.forEach((dot) => dot.removeAttribute("data-active"));
      };
    },
    { scope: root, dependencies: [live] },
  );

  return (
    <section ref={root} id="about" className={styles.band} data-about-film data-live={live ? "" : undefined} aria-labelledby="about-title">
      <div className={styles.stage} data-film-stage>
        <header className={styles.head} data-film-head>
          <MicroLabel className={styles.label}>{label}</MicroLabel>
          <h2 id="about-title" className={styles.title}>
            {title.split(" ").map((word, i) => (
              <span key={i} className={styles.mask}>
                <span data-film-word>{word}</span>
              </span>
            ))}
          </h2>
        </header>

        <div className={styles.view} data-film-view>
          {live && mounted ? (
            <ArchitecturalScene
              state={state}
              lite={lite}
              onReady={(inv) => {
                invalidate.current = inv;
                inv();
              }}
            />
          ) : (
            <Elevation />
          )}
        </div>

        <TransformationTimeline stages={stages} close={close} />
        <Finale title={finale.title} body={finale.body} />
        <span className={styles.dusk} data-film-dusk aria-hidden="true" />
      </div>
    </section>
  );
}
