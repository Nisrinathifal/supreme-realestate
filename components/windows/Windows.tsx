"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { Lang } from "@/content/routes";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/motion";
import { enterTimeline, previewIn, previewOut, swapStage } from "./motion";
import { ProjectPage } from "./ProjectPage";
import type { WindowProject, WindowStrings } from "./types";
import s from "./windows.module.css";

export type { WindowProject, WindowStrings } from "./types";
type Props = { lang: Lang; projects: WindowProject[]; strings: WindowStrings };
type Phase = "idle" | "entering" | "open" | "leaving";

/** Gap between a window and its preview, and the hero-width share beyond which the preview sits on the left. */
const CARD_GAP = 1.4;
const CARD_FLIP_AT = 62;
const HIDE_DELAY = 160;

/** Fired on <document> by another way in (the phone's project strip): detail { id, from } enters from that element. */
export const ENTER_PROJECT = "supreme:enter-project";

const noop = () => () => {};
/** True once on the client, false in the server render (so the portal and the query flag never mismatch hydration). */
const useClient = () => useSyncExternalStore(noop, () => true, () => false);
const useDebugFlag = () =>
  useSyncExternalStore(
    noop,
    () => {
      const flag = new URLSearchParams(window.location.search).get("debug");
      return flag === "windows" || flag === "true" || flag === "1";
    },
    () => false,
  );

/**
 * Project windows (concept 2026-10-05): the architecture as the interface. Four hotspots, one per project, sit on
 * windows of four different houses in the hero film (positions in percent of the film, content/projects.ts); they
 * are plain frames, no names or places, and they arrive only once the page has scrolled into the facades
 * (HeroScroll sets `data-shown` once dusk has fallen and the spotlight, a masked dark layer with a hole at each
 * window, is on). Hover or keyboard focus lights a window and shows a small preview beside it: the room, the project's
 * name and its city (not on touch, where a tap goes straight in); click, tap or Enter goes in: the through-the-window
 * timeline (motion.ts) into a fixed overlay (portalled to <body>, above the header) with the interior, the
 * project's name, then the project page (ProjectPage: story, before/after, photos, next) and the index of all four, and a way
 * back that plays the timeline in reverse. `?debug=windows` outlines the film box and every hotspot in lime, for
 * tuning against the footage (the numbers are in content/projects.ts). UI state (active, open, phase) lives in React; the timelines read it.
 */
export function Windows({ lang, projects, strings }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [warmed, setWarmed] = useState<string[]>([]);
  const mounted = useClient();
  const debug = useDebugFlag();
  const filmRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tl = useRef<ReturnType<typeof enterTimeline> | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const byId = (id: string | null) => projects.find((p) => p.id === id) ?? null;
  const ap = byId(active);
  const op = byId(open);

  useEffect(() => {
    setupGsap();
    if (cardRef.current) gsap.set(cardRef.current, { autoAlpha: 0 });
  }, []);

  /* ---------- hover / focus: the window lifts, its preview appears, its interior loads ahead of the click ---------- */
  const cancelHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const show = (id: string) => {
    cancelHide();
    setActive(id);
    setWarmed((w) => (w.includes(id) ? w : [...w, id]));
  };
  // A short grace so the pointer can cross the gap from the window to its preview
  const hide = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setActive(null), HIDE_DELAY);
  };

  // The preview sits beside the lit window, measured against the hero (a plain child of it) and re-placed every
  // frame while it shows, so it follows the window through any motion of the frame
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !mounted) return;
    if (!active) {
      previewOut(card, prefersReducedMotion());
      return;
    }
    const hotspot = filmRef.current?.querySelector<HTMLElement>(`[data-window="${active}"]`);
    const hero = card.parentElement;
    if (!hotspot || !hero) return;
    const place = () => {
      const h = hotspot.getBoundingClientRect();
      const r = hero.getBoundingClientRect();
      const flip = h.left + h.width / 2 > r.left + (r.width * CARD_FLIP_AT) / 100;
      const gap = (r.width * CARD_GAP) / 100;
      // Final pixels, not a CSS translate: GSAP folds that property into its own transform on first use
      card.dataset.side = flip ? "left" : "right";
      card.style.left = `${(flip ? h.left - gap - card.offsetWidth : h.right + gap) - r.left}px`;
      card.style.top = `${h.top + h.height / 2 - card.offsetHeight / 2 - r.top}px`;
    };
    place();
    previewIn(card, prefersReducedMotion());
    let raf = requestAnimationFrame(function tick() {
      place();
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [active, mounted]);

  /* ---------- enter, leave, switch ---------- */
  const exteriorParts = () => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    return [hero?.querySelector<HTMLElement>("[data-hero-frame]"), hero?.querySelector<HTMLElement>("canvas"), hero?.querySelector<HTMLElement>("[data-windows]")].filter(
      (el): el is HTMLElement => Boolean(el),
    );
  };

  const enter = useCallback(
    (id: string, from?: HTMLElement) => {
      if (phase !== "idle") return;
      const p = projects.find((x) => x.id === id);
      if (!p?.interior) return;
      returnTo.current = from ?? filmRef.current?.querySelector<HTMLElement>(`[data-window="${id}"]`) ?? null;
      cancelHide();
      setWarmed((w) => (w.includes(id) ? w : [...w, id]));
      setActive(null);
      setOpen(id);
      setPhase("entering");
    },
    [phase, projects],
  );

  useEffect(() => {
    const onEnter = (e: Event) => {
      const { id, from } = (e as CustomEvent<{ id: string; from?: HTMLElement }>).detail;
      enter(id, from);
    };
    document.addEventListener(ENTER_PROJECT, onEnter);
    return () => document.removeEventListener(ENTER_PROJECT, onEnter);
  }, [enter]);

  useLayoutEffect(() => {
    if (phase !== "entering" || !open) return;
    const overlay = overlayRef.current;
    const hotspot = returnTo.current;
    const exterior = exteriorParts();
    if (!overlay || !hotspot || !exterior.length) {
      setPhase("open");
      return;
    }
    document.documentElement.setAttribute("data-project-open", "");
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    tl.current = enterTimeline({
      overlay,
      rect: hotspot.getBoundingClientRect(),
      exterior,
      reduced: prefersReducedMotion(),
      onComplete: () => {
        setPhase("open");
        overlay.querySelector<HTMLElement>("[data-project-focus]")?.focus({ preventScroll: true });
      },
    });
  }, [phase, open]);

  const close = useCallback(() => {
    if (phase !== "open") return;
    const t = tl.current;
    const done = () => {
      document.documentElement.removeAttribute("data-project-open");
      tl.current = null;
      setOpen(null);
      setPhase("idle");
      returnTo.current?.focus({ preventScroll: true });
    };
    if (!t) return done();
    setPhase("leaving");
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    t.eventCallback("onReverseComplete", done);
    t.reverse();
  }, [phase]);

  const switchTo = (id: string) => {
    if (phase !== "open" || id === open) return;
    const p = projects.find((x) => x.id === id);
    const stage = overlayRef.current?.querySelector<HTMLElement>("[data-stage]");
    if (!p?.interior || !stage) return;
    setWarmed((w) => (w.includes(id) ? w : [...w, id]));
    scrollerRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    swapStage(stage, () => setOpen(id), prefersReducedMotion());
  };

  const toOverview = () =>
    scrollerRef.current
      ?.querySelector<HTMLElement>("[data-project-sheet]")
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  const nextOf = (id: string) => projects[(projects.findIndex((p) => p.id === id) + 1) % projects.length];

  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, close]);

  useEffect(
    () => () => {
      tl.current?.kill();
      document.documentElement.removeAttribute("data-project-open");
    },
    [],
  );

  const dimStyle = ap?.window ? ({ "--cx": `${ap.window.x + ap.window.w / 2}%`, "--cy": `${ap.window.y + ap.window.h / 2}%` } as CSSProperties) : undefined;
  // Spotlight mask: one soft hole per window; the layer is intersected with all of them, so it darkens only outside
  const spotsStyle = {
    "--spots": projects
      .filter((p) => p.window)
      .map(({ window: w }) => `radial-gradient(ellipse ${w!.w * 2.6}% ${w!.h * 1.9}% at ${w!.x + w!.w / 2}% ${w!.y + w!.h / 2}%, transparent 45%, black 100%)`)
      .join(", "),
  } as CSSProperties;

  return (
    <>
      <div className={s.layer} data-windows data-debug={debug ? "true" : "false"}>
        <div className={s.film} ref={filmRef}>
          <div className={s.spots} data-spots style={spotsStyle} aria-hidden="true" />
          <div className={s.dim} data-on={ap ? "true" : "false"} style={dimStyle} aria-hidden="true" />
          {projects.map((p) => {
            const w = p.window;
            if (!w) return null;
            return (
              <button
                key={p.id}
                type="button"
                className={s.hotspot}
                data-window={p.id}
                data-active={active === p.id ? "true" : "false"}
                style={{ left: `${w.x}%`, top: `${w.y}%`, width: `${w.w}%`, height: `${w.h}%` }}
                aria-label={p.label}
                aria-haspopup="dialog"
                onPointerEnter={(e) => {
                  if (e.pointerType !== "touch") show(p.id);
                }}
                onPointerLeave={hide}
                // Keyboard focus lifts the window; focus handed back after closing (a pointer journey) does not
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) show(p.id);
                }}
                onBlur={hide}
                onClick={() => enter(p.id)}
              />
            );
          })}
        </div>
        {/* The interior of a lifted window loads ahead of the click; nothing else does */}
        <div className={s.warm} aria-hidden="true">
          {projects
            .filter((p) => p.interior && warmed.includes(p.id) && p.id !== open)
            .map((p) => (
              <MediaFrame key={p.id} image={p.interior} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative priority />
            ))}
        </div>
      </div>
      {/* Preview beside the lifted window: the room, the name and the city, and an arrow (the window is the control) */}
      <div ref={cardRef} className={s.card} data-side="right" aria-hidden="true" onPointerEnter={cancelHide} onPointerLeave={hide}>
        {ap ? (
          <button type="button" className={s.cardButton} tabIndex={-1} onClick={() => enter(ap.id)}>
            <MediaFrame image={ap.preview} ratio="16/9" lang={lang} radius="none" sizes="280px" decorative priority className={s.cardMedia} />
            <span className={s.cardFoot}>
              <span className={s.cardText}>
                <span className={s.cardName}>{ap.name}</span>
                <span className={s.cardMeta}>{ap.location}</span>
              </span>
              <ArrowRight size={18} weight="light" className={s.cardArrow} aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>

      {mounted
        ? createPortal(
            <div
              ref={overlayRef}
              className={s.overlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-title"
              data-project-overlay
              data-phase={phase}
              data-lenis-prevent
              hidden={phase === "idle"}
            >
              <div className={s.dimmer} data-dimmer aria-hidden="true" />
              <div className={s.stage} data-stage aria-hidden="true">
                <div className={s.image} data-image>
                  {op?.interior ? <MediaFrame image={op.interior} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative priority /> : null}
                </div>
                <div className={s.stageScrim} />
              </div>
              <div className={s.scroller} data-scroller ref={scrollerRef}>
                {op ? (
                  <>
                    <section className={s.titleScreen}>
                      <div className={s.titleBlock} data-project-focus tabIndex={-1}>
                        <p className={`t-micro ${s.eyebrow}`}>{strings.eyebrow}</p>
                        <h2 id="project-title" className={s.name}>
                          {op.name}
                        </h2>
                        <p className={s.meta}>
                          {op.location} · {op.category}
                        </p>
                        <button type="button" className={s.exploreBtn} onClick={toOverview} aria-label={strings.explore}>
                          <ArrowRight size={20} weight="light" aria-hidden="true" />
                        </button>
                        <p className={`t-micro ${s.exploreLabel}`} aria-hidden="true">
                          {strings.explore}
                        </p>
                      </div>
                    </section>
                    <ProjectPage
                      key={op.id}
                      project={op}
                      next={nextOf(op.id)}
                      lang={lang}
                      strings={strings.page}
                      scroller={scrollerRef}
                      live={phase === "open"}
                      onNext={(id) => switchTo(id)}
                    />
                    <section className={`inverse ${s.indexSection}`} aria-label={strings.index}>
                      <div className={s.indexInner}>
                        <div className={s.indexHead}>
                          <p className="t-micro">{strings.index}</p>
                          <h3 className={s.indexTitle}>{strings.more}</h3>
                        </div>
                        <ul className={s.indexList}>
                          {projects.map((p) => {
                            const current = p.id === open;
                            const available = Boolean(p.interior);
                            return (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  className={s.indexItem}
                                  aria-current={current ? "true" : undefined}
                                  aria-disabled={available ? undefined : "true"}
                                  onClick={() => (available ? switchTo(p.id) : undefined)}
                                >
                                  <MediaFrame image={p.preview} ratio="4/5" lang={lang} radius="lg" sizes="(max-width: 767px) 45vw, 22vw" decorative />
                                  <span className={s.indexName}>{p.name}</span>
                                  <span className={s.indexMeta}>
                                    {p.location} · {p.category}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
              <button type="button" className={s.back} data-back onClick={close}>
                <ArrowLeft size={18} weight="light" aria-hidden="true" />
                <span>{strings.back}</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
