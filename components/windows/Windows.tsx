"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { WindowBox } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/motion";
import { enterTimeline, previewIn, previewOut, swapStage } from "./motion";
import s from "./windows.module.css";

export type WindowProject = {
  id: string;
  name: string;
  location: string;
  category: string;
  country: string;
  description: string;
  /** Accessible name of the window ("Explore Durgerdammergouw"). */
  label: string;
  preview: ImageAsset;
  interior: ImageAsset | null;
  window: WindowBox | null;
};
export type WindowStrings = { eyebrow: string; explore: string; back: string; more: string; index: string };
type Props = { lang: Lang; projects: WindowProject[]; strings: WindowStrings };
type Phase = "idle" | "entering" | "open" | "leaving";

/** Gap between a window and its preview card, in percent of the hero width. */
const CARD_GAP = 1.4;
/** Windows further right than this (percent of the hero width) get their card on the left. */
const CARD_FLIP_AT = 62;
const HIDE_DELAY = 160;

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
 * Project windows (concept 2026-10-05): the architecture as the interface. One invisible hotspot per project sits
 * on its window in the hero film (positions in percent of the film, see content/projects.ts). Hover or focus
 * lifts the window a touch, dims the rest of the facade and shows an editorial preview card beside it; on touch
 * the first tap previews and the second enters. Entering plays the through-the-window timeline (motion.ts) into
 * a fixed overlay (portalled to <body>, above the header): the interior, the project's name, the overview and the
 * index of all four projects, with a way back that plays the same timeline in reverse. `?debug=windows` outlines
 * the film box and every hotspot with its id and numbers, for tuning against the footage.
 * UI state (active, open, phase) lives in React; the timelines read it, never the other way round.
 */
export function Windows({ lang, projects, strings }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [warmed, setWarmed] = useState<string[]>([]);
  const mounted = useClient();
  const debug = useDebugFlag();
  const touch = useRef(false);
  /** Pointer type of the last press on a window: a touch previews first, a mouse or pen enters at once. */
  const lastPointer = useRef<string>("mouse");
  const hideTimer = useRef<number | null>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  const tl = useRef<ReturnType<typeof enterTimeline> | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const byId = (id: string | null) => projects.find((p) => p.id === id) ?? null;
  const ap = byId(active);
  const op = byId(open);

  useEffect(() => {
    setupGsap();
    touch.current = window.matchMedia("(hover: none)").matches;
    if (cardRef.current) gsap.set(cardRef.current, { autoAlpha: 0 });
  }, []);

  /* ---------- preview: hover, focus, first tap ---------- */
  const cancelHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const show = (id: string) => {
    cancelHide();
    setActive(id);
    setWarmed((w) => (w.includes(id) ? w : [...w, id]));
  };
  const hideSoon = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setActive(null), HIDE_DELAY);
  };
  // The card sits beside the active window: measured against the hero, so it is a plain child of the hero (not of
  // the sized film box, whose containment would also trap the phone's fixed sheet) and the phone can pin it.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !mounted) return;
    if (!active) {
      previewOut(card, prefersReducedMotion());
      return;
    }
    const hotspot = filmRef.current?.querySelector<HTMLElement>(`[data-window="${active}"]`);
    const hero = card.parentElement;
    if (hotspot && hero) {
      const h = hotspot.getBoundingClientRect();
      const r = hero.getBoundingClientRect();
      const flip = h.left + h.width / 2 > r.left + (r.width * CARD_FLIP_AT) / 100;
      const gap = (r.width * CARD_GAP) / 100;
      card.dataset.side = flip ? "left" : "right";
      card.style.setProperty("--card-left", `${(flip ? h.left - gap : h.right + gap) - r.left}px`);
      card.style.setProperty("--card-top", `${h.top + h.height / 2 - r.top}px`);
    }
    previewIn(card, prefersReducedMotion());
  }, [active, mounted]);

  /* ---------- enter, leave, switch ---------- */
  const enter = useCallback(
    (id: string) => {
      if (phase !== "idle") return;
      const p = projects.find((x) => x.id === id);
      if (!p?.interior) return;
      returnTo.current = filmRef.current?.querySelector<HTMLElement>(`[data-window="${id}"]`) ?? null;
      cancelHide();
      setWarmed((w) => (w.includes(id) ? w : [...w, id]));
      setActive(null);
      setOpen(id);
      setPhase("entering");
    },
    [phase, projects],
  );

  useLayoutEffect(() => {
    if (phase !== "entering" || !open) return;
    const overlay = overlayRef.current;
    const hotspot = returnTo.current;
    const exterior = document.querySelector<HTMLElement>("[data-hero-frame]");
    if (!overlay || !hotspot || !exterior) {
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
    const exterior = document.querySelector<HTMLElement>("[data-hero-frame]");
    const done = () => {
      document.documentElement.removeAttribute("data-project-open");
      if (exterior) gsap.set(exterior, { clearProps: "transform" });
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

  const toOverview = () => overviewRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

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

  return (
    <>
      <div className={s.layer} data-windows data-debug={debug ? "true" : "false"}>
        <div className={s.film} ref={filmRef}>
          <div className={s.dim} data-on={ap ? "true" : "false"} style={dimStyle} aria-hidden="true" />
          {projects.map((p) => {
            const w = p.window;
            if (!w) return null;
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={s.hotspot}
                data-window={p.id}
                data-active={isActive ? "true" : "false"}
                style={{ left: `${w.x}%`, top: `${w.y}%`, width: `${w.w}%`, height: `${w.h}%` }}
                aria-label={p.label}
                aria-haspopup="dialog"
                onPointerEnter={(e) => {
                  if (e.pointerType !== "touch" && !touch.current) show(p.id);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType !== "touch" && !touch.current) hideSoon();
                }}
                onPointerDown={(e) => {
                  lastPointer.current = e.pointerType;
                }}
                // Keyboard focus previews; focus handed back after closing (a mouse journey) does not
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) show(p.id);
                }}
                onBlur={hideSoon}
                onClick={() => {
                  const byTouch = lastPointer.current === "touch" || touch.current;
                  if (byTouch && !isActive) show(p.id);
                  else enter(p.id);
                }}
              >
                {debug ? (
                  <>
                    <span className={s.debugDot} aria-hidden="true" />
                    <span className={s.debugLabel} aria-hidden="true">
                      {p.id} · x {w.x} y {w.y} w {w.w} h {w.h}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
        {/* The interior of a previewed window loads ahead of the click; nothing else does */}
        <div className={s.warm} aria-hidden="true">
          {projects
            .filter((p) => p.interior && warmed.includes(p.id) && p.id !== open)
            .map((p) => (
              <MediaFrame key={p.id} image={p.interior} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative priority />
            ))}
        </div>
      </div>
        <div
          ref={cardRef}
          className={s.card}
          data-side="right"
          onPointerEnter={cancelHide}
          onPointerLeave={hideSoon}
          aria-hidden={ap ? undefined : true}
        >
          {ap ? (
            <button type="button" className={s.cardButton} onClick={() => enter(ap.id)} onFocus={cancelHide} onBlur={hideSoon} tabIndex={-1} aria-label={ap.label}>
              <MediaFrame image={ap.preview} ratio="16/9" lang={lang} radius="none" sizes="300px" decorative priority className={s.cardMedia} />
              <span className={s.cardText}>
                <span className={s.cardName}>{ap.name}</span>
                <span className={s.cardMeta}>
                  {ap.location} · {ap.category}
                </span>
              </span>
              <ArrowRight size={18} weight="light" className={s.cardArrow} aria-hidden="true" />
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
                    <section className={`inverse ${s.overview}`} ref={overviewRef} aria-label={op.name}>
                      <div className={s.overviewGrid}>
                        <MediaFrame image={op.interior} ratio="16/9" lang={lang} sizes="(max-width: 767px) 100vw, 60vw" />
                        <div className={s.info}>
                          <p className="t-micro">{op.category}</p>
                          <h3 className={s.infoName}>{op.name}</h3>
                          <p className={s.infoPlace}>
                            {op.location}, {op.country}
                          </p>
                          <p className={s.infoBody}>{op.description}</p>
                        </div>
                      </div>
                    </section>
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
