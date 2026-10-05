"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { WindowBox } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { prefersReducedMotion, setupGsap } from "@/lib/motion";
import { enterTimeline, swapStage } from "./motion";
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
 * (HeroZoom sets `data-shown`). Hover or keyboard focus lifts a window and dims the rest of the facade; click, tap
 * or Enter goes in: the through-the-window timeline (motion.ts) into a fixed overlay (portalled to <body>, above
 * the header) with the interior, the project's name, the overview and the index of all four projects, and a way
 * back that plays the timeline in reverse. `?debug=windows` outlines the film box and every hotspot with its id and
 * numbers, for tuning against the footage. UI state (active, open, phase) lives in React; the timelines read it.
 */
export function Windows({ lang, projects, strings }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [warmed, setWarmed] = useState<string[]>([]);
  const mounted = useClient();
  const debug = useDebugFlag();
  const filmRef = useRef<HTMLDivElement>(null);
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
  }, []);

  /* ---------- hover / focus: the window lifts and its interior loads ahead of the click ---------- */
  const show = (id: string) => {
    setActive(id);
    setWarmed((w) => (w.includes(id) ? w : [...w, id]));
  };
  const hide = () => setActive(null);

  /* ---------- enter, leave, switch ---------- */
  const exteriorParts = () => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    return [hero?.querySelector<HTMLElement>("[data-hero-frame]"), hero?.querySelector<HTMLElement>("canvas"), hero?.querySelector<HTMLElement>("[data-windows]")].filter(
      (el): el is HTMLElement => Boolean(el),
    );
  };

  const enter = useCallback(
    (id: string) => {
      if (phase !== "idle") return;
      const p = projects.find((x) => x.id === id);
      if (!p?.interior) return;
      returnTo.current = filmRef.current?.querySelector<HTMLElement>(`[data-window="${id}"]`) ?? null;
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
        {/* The interior of a lifted window loads ahead of the click; nothing else does */}
        <div className={s.warm} aria-hidden="true">
          {projects
            .filter((p) => p.interior && warmed.includes(p.id) && p.id !== open)
            .map((p) => (
              <MediaFrame key={p.id} image={p.interior} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative priority />
            ))}
        </div>
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
