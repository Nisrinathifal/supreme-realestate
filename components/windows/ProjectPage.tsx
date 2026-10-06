"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type Lenis from "lenis";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { Lang } from "@/content/routes";
import { gsap, MQ, prefersReducedMotion, ScrollTrigger, setupGsap } from "@/lib/motion";
import { Compare } from "./Compare";
import { Lightbox } from "./Lightbox";
import type { PageStrings, WindowProject } from "./types";
import s from "./project.module.css";

type Props = {
  project: WindowProject;
  /** The other projects, offered at the foot of the page. */
  others: WindowProject[];
  lang: Lang;
  strings: PageStrings;
  scroller: RefObject<HTMLDivElement | null>;
  /** The overlay's own smooth scroll (null under reduced motion). */
  lenis: RefObject<Lenis | null>;
  /** The overlay has finished entering: measurements are final. */
  live: boolean;
  onOpen: (id: string) => void;
};

/**
 * How the photographs are laid (after the reference: each about a screen tall, one at a time, edge to edge,
 * square-cornered): `full` spans the page; `tallLeft` / `tallRight` fill half of it against one edge; `wide` takes
 * most of it from the right; `pair` sets two halves side by side with a hairline gap. The sides alternate, so
 * there is always open Stone beside or between the pictures. Each part of the gallery starts from its own point in
 * the cycle; a pair never gets left with one photograph.
 */
type Block = "full" | "tallLeft" | "wide" | "pair" | "tallRight";
const CYCLE: Block[] = ["full", "tallLeft", "wide", "pair", "full", "tallRight"];
function compose(count: number, offset: number) {
  const out: { kind: Block; n: number }[] = [];
  let k = offset;
  let left = count;
  while (left > 0) {
    let kind = CYCLE[k++ % CYCLE.length];
    if (kind === "pair" && left < 2) kind = "full";
    const n = kind === "pair" ? 2 : 1;
    out.push({ kind, n });
    left -= n;
  }
  return out;
}

/** Words as spans, for the scroll reveal; screen readers still read one sentence. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} data-word>
          {w}{" "}
        </span>
      ))}
    </>
  );
}

type SpreadProps = {
  gallery: WindowProject["gallery"];
  /** Which photographs, by their index in the gallery (the viewer steps through all of them). */
  indices: number[];
  blocks: { kind: Block; n: number }[];
  lang: Lang;
  onOpen: (i: number) => void;
};

/** One run of the gallery: blocks of photographs, each a button into the viewer. */
function Spread({ gallery, indices, blocks, lang, onOpen }: SpreadProps) {
  const starts = blocks.map((_, bi) => blocks.slice(0, bi).reduce((n, b) => n + b.n, 0));
  return (
    <div className={s.spread}>
      {blocks.map((b, bi) => (
        <div key={bi} className={s.block} data-kind={b.kind}>
          {indices.slice(starts[bi], starts[bi] + b.n).map((index, j) => {
            const item = gallery[index];
            return (
              <button
                key={index}
                type="button"
                className={s.tile}
                data-tile={index}
                data-pair={b.kind === "pair" ? j : undefined}
                onClick={() => onOpen(index)}
                aria-label={item.open}
              >
                <MediaFrame image={item.image} ratio="fill" lang={lang} radius="none" sizes={b.kind === "full" || b.kind === "wide" ? "100vw" : "(max-width: 767px) 100vw, 50vw"} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * The project page (2026-10-06, after the owner's reference: an architectural studio's project page). The room is the
 * hero: the project's name large over it, what it is under that, and the credits along its foot. Then, on Stone, the
 * overview, and the photographs edge to edge (no rounded corners), each about a screen tall, opening one at a time
 * with the scroll; before and after on Canal ink; the rest of the photographs; why it matters; the project
 * details (the story and every credit); and the other three projects. Every photograph opens into the viewer.
 * Scrolling runs on the overlay's own Lenis (Windows), so the reveals are smooth; reduced motion keeps every state final.
 * Credits the owner has not given yet read "To be confirmed" (draft copy), never a guess.
 */
export function ProjectPage({ project, others, lang, strings, scroller, lenis, live, onOpen }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const p = project;
  // The hero already shows the room: the spreads leave that photograph out (the viewer keeps it)
  const shown = p.gallery.map((_, i) => i).filter((i) => p.gallery[i].image.src !== p.interior?.src);
  const half = Math.ceil(shown.length / 2);

  const tileFor = useCallback((i: number) => root.current?.querySelector<HTMLElement>(`[data-tile="${i}"]`) ?? null, []);
  const scrollToEl = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: -24, duration: 1.4 });
    else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  useLayoutEffect(() => {
    setupGsap();
    const el = root.current;
    const sc = scroller.current;
    if (!el || !sc) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const st = (vars: ScrollTrigger.Vars) => ({ scroller: sc, ...vars });
      const mm = gsap.matchMedia();
      mm.add({ full: MQ.full, phone: "(max-width: 767px)" }, (c) => {
        if (!c.conditions?.full) return;
        const k = c.conditions.phone ? 0.5 : 1;

        // The name and the credits step back as the Stone comes up over the room
        const body = q<HTMLElement>("[data-body]")[0];
        const heroBits = q<HTMLElement>("[data-hero-copy], [data-hero-credits]");
        if (body) gsap.to(heroBits, { y: -64, opacity: 0, ease: "none", stagger: 0.04, scrollTrigger: st({ trigger: body, start: "top bottom", end: "top 30%", scrub: true }) });

        // Overview and why it matters fill in from Graphite to ink with the scroll
        const from = getComputedStyle(el).getPropertyValue("--reveal-from").trim();
        q<HTMLElement>("[data-reveal]").forEach((block) => {
          const words = block.querySelectorAll<HTMLElement>("[data-word]");
          gsap.fromTo(words, { color: from }, { color: getComputedStyle(block).color, stagger: 0.1, ease: "none", scrollTrigger: st({ trigger: block, start: "top 85%", end: "bottom 55%", scrub: true }) });
        });

        // Short blocks (labels, details, credits, cards) rise once as they arrive
        q<HTMLElement>("[data-rise]").forEach((r) =>
          gsap.fromTo(r, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: st({ trigger: r, start: "top 92%", once: true }) }),
        );

        // Photographs open one at a time, slowly, with the scroll: the frame widens and rises from its lower edge
        // while the picture inside settles from close up; then the picture drifts a little inside its frame. The
        // second of a pair opens a beat after the first.
        q<HTMLElement>("[data-tile]").forEach((tile) => {
          const img = tile.querySelector("img");
          const late = tile.dataset.pair === "1" ? 8 : 0;
          const reveal = gsap.timeline({ scrollTrigger: st({ trigger: tile, start: `top ${100 - late}%`, end: `top ${28 - late}%`, scrub: true }) });
          reveal.fromTo(tile, { clipPath: `inset(${22 * k}% ${7 * k}% 0% ${7 * k}%)` }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0);
          if (img) reveal.fromTo(img, { scale: 1.32 }, { scale: 1.06, ease: "none" }, 0);
          if (img) gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: st({ trigger: tile, start: "top bottom", end: "bottom top", scrub: true }) });
        });

        // The before/after frame opens out to the page's edges as it arrives
        const frame = q<HTMLElement>("[data-compare-frame]")[0];
        if (frame) gsap.fromTo(frame, { clipPath: "inset(0% 8% 0% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: st({ trigger: frame, start: "top bottom", end: "top 30%", scrub: true }) });
      });
      return () => mm.revert();
    }, el);
    return () => ctx.revert();
  }, [scroller]);

  // Measurements settle once the overlay's enter timeline has finished (it moves the scroller)
  useLayoutEffect(() => {
    if (!live || !scroller.current) return;
    lenis.current?.resize();
    ScrollTrigger.getAll()
      .filter((t) => t.scroller === scroller.current)
      .forEach((t) => t.refresh());
  }, [live, scroller, lenis]);

  const heroCredits = p.credits.filter((c) => c.hero);
  const chapters = p.story
    ? [
        { key: "approach" as const, text: p.story.approach },
        { key: "outcome" as const, text: p.story.outcome },
      ]
    : [];
  const spread = (indices: number[], offset: number) => (
    <Spread gallery={p.gallery} indices={indices} blocks={compose(indices.length, offset)} lang={lang} onOpen={setViewer} />
  );

  return (
    <div ref={root} className={s.page}>
      {/* The room as the hero: name, what it is, credits along the foot */}
      <header className={s.hero}>
        <div className={s.heroCopy} data-hero-copy data-project-focus tabIndex={-1}>
          <p className={`t-micro ${s.heroKicker}`}>
            {p.category} · {p.location}
          </p>
          <h2 id="project-title" className={s.heroName}>
            {p.name}
          </h2>
          <p className={s.heroTitle}>{p.title}</p>
        </div>
        <dl className={s.heroCredits} data-hero-credits>
          {heroCredits.map((c) => (
            <div key={c.label} className={s.heroCredit}>
              <dt>{c.label}</dt>
              <dd data-pending={c.pending ? "true" : undefined}>{c.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className={`light ${s.body}`} data-body>
        <section className={s.split} aria-labelledby="project-overview">
          <h3 id="project-overview" className={`t-micro ${s.label}`} data-rise>
            {strings.overview}
          </h3>
          <div className={s.splitMain}>
            {p.lede ? (
              <p className={s.overviewLede} data-rise>
                {p.lede}
              </p>
            ) : null}
            {p.story ? (
              <p className={s.overviewText} data-reveal>
                <Words text={p.story.opportunity} />
              </p>
            ) : null}
            <button type="button" className={s.textLink} onClick={() => scrollToEl(root.current?.querySelector<HTMLElement>("[data-details]"))} data-rise>
              <ArrowDown size={16} weight="light" aria-hidden="true" />
              {strings.details}
            </button>
          </div>
        </section>
        {spread(shown.slice(0, half), 0)}
      </div>

      {p.compare.length ? (
        <section className={`inverse ${s.compareBand}`} aria-label={strings.compare.title}>
          <Compare pairs={p.compare} strings={strings.compare} lang={lang} scroller={scroller} />
        </section>
      ) : null}

      <div className={`light ${s.body}`}>
        {spread(shown.slice(half), 2)}
        {p.story ? (
          <section className={s.split} aria-labelledby="chapter-why">
            <h3 id="chapter-why" className={`t-micro ${s.label}`} data-rise>
              {strings.chapters.why}
            </h3>
            <p className={s.whyText} data-reveal>
              <Words text={p.story.why} />
            </p>
          </section>
        ) : null}
        <section className={`${s.split} ${s.details}`} data-details aria-labelledby="project-details">
          <h3 id="project-details" className={`t-micro ${s.label}`} data-rise>
            {strings.details}
          </h3>
          <div className={s.splitMain}>
            {chapters.map((c) => (
              <div key={c.key} className={s.chapter} data-rise>
                <h4 className={s.chapterLabel}>{strings.chapters[c.key]}</h4>
                <p className={s.chapterText}>{c.text}</p>
              </div>
            ))}
            <dl className={s.credits} data-rise>
              {p.credits.map((c) => (
                <div key={c.label} className={s.credit}>
                  <dt className="t-micro">{c.label}</dt>
                  <dd data-pending={c.pending ? "true" : undefined}>{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      {others.length ? (
        <section className={`inverse ${s.others}`} aria-labelledby="project-others">
          <h3 id="project-others" className={s.othersTitle} data-rise>
            {strings.others}
          </h3>
          <ul className={s.othersList}>
            {others.map((o) => (
              <li key={o.id} data-rise>
                <button type="button" className={s.card} onClick={() => onOpen(o.id)} aria-label={`${strings.view}: ${o.name}`}>
                  <span className={s.cardMedia}>
                    <MediaFrame image={o.preview} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 100vw, 33vw" decorative />
                  </span>
                  <span className={s.cardFoot}>
                    <span className={s.cardText}>
                      <span className={s.cardName}>{o.name}</span>
                      <span className={s.cardMeta}>{o.title}</span>
                    </span>
                    <span className={s.cardArrow} aria-hidden="true">
                      <ArrowUpRight size={20} weight="light" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {viewer !== null ? (
        <Lightbox items={p.gallery} start={viewer} tileFor={tileFor} onClose={() => setViewer(null)} strings={strings.gallery} lang={lang} />
      ) : null}
    </div>
  );
}
