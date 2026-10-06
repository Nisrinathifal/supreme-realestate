"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type Lenis from "lenis";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
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
  /** The site footer, closing the page. */
  footer: ReactNode;
  /** A link in the footer leaves the overlay at once. */
  onLeave: () => void;
};

/**
 * How the photographs are laid (after the reference: each about a screen tall, one at a time, edge to edge,
 * square-cornered): `full` spans the page; `tallLeft` / `tallRight` fill half of it against one edge, the other half
 * holding a short line of narrative; `wide` takes most of it from the right; `pair` sets two halves side by side with
 * a hairline gap. A pair never gets left with one photograph.
 */
type Block = "full" | "tallLeft" | "wide" | "pair" | "tallRight";
const CYCLE: Block[] = ["full", "tallLeft", "wide", "pair", "full", "tallRight"];
function compose(count: number) {
  const out: { kind: Block; n: number }[] = [];
  let k = 0;
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

type GalleryProps = {
  gallery: WindowProject["gallery"];
  /** Which photographs, by their index in the gallery (the viewer steps through all of them). */
  indices: number[];
  notes: PageStrings["notes"];
  lang: Lang;
  onOpen: (i: number) => void;
};

/**
 * The photographs, each a button into the viewer. Beside a half-width photograph the open half carries a line of the
 * brand's path (Reimagined, Transformed, …) and what the photograph shows, numbered, so the run reads as a story.
 */
function Gallery({ gallery, indices, notes, lang, onOpen }: GalleryProps) {
  const blocks = compose(indices.length);
  const starts = blocks.map((_, bi) => blocks.slice(0, bi).reduce((n, b) => n + b.n, 0));
  const total = String(indices.length).padStart(2, "0");
  let noteIndex = 0;
  const notesAt = blocks.map((b) => (b.kind === "tallLeft" || b.kind === "tallRight" ? notes[noteIndex++ % notes.length] : null));
  return (
    <div className={s.spread}>
      {blocks.map((b, bi) => {
        const tiles = indices.slice(starts[bi], starts[bi] + b.n).map((index, j) => {
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
        });
        const note = notesAt[bi];
        const first = gallery[indices[starts[bi]]];
        return (
          <div key={bi} className={s.block} data-kind={b.kind}>
            {note ? (
              <div className={s.note} data-rise>
                <p className={`t-micro ${s.noteTitle}`}>{note.title}</p>
                <p className={s.noteText}>{note.body}</p>
                <p className={s.noteCaption}>
                  <span className={s.noteNumber}>
                    {String(starts[bi] + 1).padStart(2, "0")} / {total}
                  </span>
                  {first.image.alt[lang]}
                </p>
              </div>
            ) : null}
            {tiles}
          </div>
        );
      })}
    </div>
  );
}

/** The badge in the hero: words turning around a small mouse, after the reference (NGH). */
function ScrollBadge({ label, id, onClick }: { label: string; id: string; onClick: () => void }) {
  const word = `${label.toUpperCase()} · `;
  const text = word.length > 16 ? word : word + word;
  return (
    <button type="button" className={s.badge} data-scroll-badge onClick={onClick} aria-label={label}>
      <svg className={s.badgeRing} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={`badge-ring-${id}`} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className={s.badgeText}>
          <textPath href={`#badge-ring-${id}`} textLength="232" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className={s.badgeMouse} aria-hidden="true">
        <span className={s.badgeDot} />
      </span>
    </button>
  );
}

/**
 * The project page (2026-10-06, after the owner's references: an architectural studio's project page, and NGH for
 * the scroll badge). The room is the hero: the name large over it, what it is, the credits along its foot, and a
 * scroll badge that rises to the top centre and holds there until the hero has gone; only then does the overlay's
 * back control appear (the overlay reads `data-past-hero`). Then, in the owner's order: overview; before and after;
 * why it matters and the outcome; the photographs, a screen tall each, opening one at a time, with lines of
 * narrative in the open halves; the project details (approach and every credit); the other projects, sliding up
 * over the details, which step back beneath them; and the site footer. Scrolling runs on the overlay's own Lenis;
 * reduced motion keeps every state final. Credits not given yet read "To be confirmed" (draft), never a guess.
 */
export function ProjectPage({ project, others, lang, strings, scroller, lenis, live, onOpen, footer, onLeave }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const p = project;
  // The hero already shows the room: the gallery leaves that photograph out (the viewer keeps it)
  const shown = p.gallery.map((_, i) => i).filter((i) => p.gallery[i].image.src !== p.interior?.src);

  const tileFor = useCallback((i: number) => root.current?.querySelector<HTMLElement>(`[data-tile="${i}"]`) ?? null, []);
  const scrollToEl = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  useLayoutEffect(() => {
    setupGsap();
    const el = root.current;
    const sc = scroller.current;
    if (!el || !sc) return;
    const overlay = el.closest<HTMLElement>("[data-project-overlay]");
    const pastHero = (v: boolean) => overlay && (overlay.dataset.pastHero = v ? "true" : "false");
    pastHero(false);

    // The details hold where they end while the other projects slide up over them
    const under = el.querySelector<HTMLElement>("[data-cover-under]");
    const place = () => under && under.style.setProperty("--cover-top", `${Math.min(0, sc.clientHeight - under.offsetHeight)}px`);
    place();
    const ro = new ResizeObserver(place);
    if (under) ro.observe(under);
    ro.observe(sc);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const st = (vars: ScrollTrigger.Vars) => ({ scroller: sc, ...vars });
      const hero = q<HTMLElement>("[data-hero]")[0];

      // Once the hero has gone (also under reduced motion), the back control takes the top left
      ScrollTrigger.create(st({ trigger: hero, start: "bottom 12%", onEnter: () => pastHero(true), onLeaveBack: () => pastHero(false) }));

      const mm = gsap.matchMedia();
      mm.add({ full: MQ.full, phone: "(max-width: 767px)" }, (c) => {
        if (!c.conditions?.full) return;
        const k = c.conditions.phone ? 0.5 : 1;

        // The name and the credits step back as the Stone comes up over the room
        const body = q<HTMLElement>("[data-body]")[0];
        const heroBits = q<HTMLElement>("[data-hero-copy], [data-hero-credits]");
        if (body) gsap.to(heroBits, { y: -64, opacity: 0, ease: "none", stagger: 0.04, scrollTrigger: st({ trigger: body, start: "top bottom", end: "top 30%", scrub: true }) });

        // The badge (sticky at the top centre) shrinks on its way up and fades as the hero's foot reaches it
        const badge = q<HTMLElement>("[data-scroll-badge]")[0];
        if (badge && hero) {
          gsap.set(badge, { transformOrigin: "50% 0%" });
          gsap.to(badge, { scale: 0.72, ease: "none", scrollTrigger: st({ trigger: hero, start: "top top", end: () => `+=${Math.max(1, badge.offsetTop - 16)}`, scrub: true, invalidateOnRefresh: true }) });
          gsap.fromTo(badge, { opacity: 1 }, { opacity: 0, ease: "none", immediateRender: false, scrollTrigger: st({ trigger: hero, start: "bottom 42%", end: "bottom 16%", scrub: true }) });
        }

        // Overview and why it matters fill in from Graphite to ink with the scroll
        const from = getComputedStyle(el).getPropertyValue("--reveal-from").trim();
        q<HTMLElement>("[data-reveal]").forEach((block) => {
          const words = block.querySelectorAll<HTMLElement>("[data-word]");
          gsap.fromTo(words, { color: from }, { color: getComputedStyle(block).color, stagger: 0.1, ease: "none", scrollTrigger: st({ trigger: block, start: "top 85%", end: "bottom 55%", scrub: true }) });
        });

        // Short blocks (labels, notes, details, credits, cards) rise once as they arrive
        q<HTMLElement>("[data-rise]").forEach((r) =>
          gsap.fromTo(r, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", scrollTrigger: st({ trigger: r, start: "top 90%", once: true }) }),
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

        // The details step back (a little smaller, dimmer) as the other projects come over them
        const underInner = q<HTMLElement>("[data-cover-inner]")[0];
        const over = q<HTMLElement>("[data-cover-over]")[0];
        if (underInner && over)
          gsap.fromTo(
            underInner,
            { scale: 1, opacity: 1 },
            { scale: 0.94, opacity: 0.35, ease: "none", transformOrigin: "50% 100%", scrollTrigger: st({ trigger: over, start: "top bottom", end: "top top", scrub: true }) },
          );
      });
      return () => mm.revert();
    }, el);
    return () => {
      ro.disconnect();
      ctx.revert();
      pastHero(false);
    };
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

  return (
    <div ref={root} className={s.page}>
      {/* The room as the hero: name, what it is, the scroll badge, credits along the foot */}
      <header className={s.hero} data-hero>
        <div className={s.heroCopy} data-hero-copy data-project-focus tabIndex={-1}>
          <p className={`t-micro ${s.heroKicker}`}>
            {p.category} · {p.location}
          </p>
          <h2 id="project-title" className={s.heroName}>
            {p.name}
          </h2>
          <p className={s.heroTitle}>{p.title}</p>
        </div>
        {/* A track as tall as the hero, so the badge can hold at the top until the hero's very foot */}
        <div className={s.badgeTrack}>
          <ScrollBadge label={strings.scroll} id={p.id} onClick={() => scrollToEl(root.current?.querySelector<HTMLElement>("[data-body]"))} />
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

      {/* Overview */}
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
          </div>
        </section>
      </div>

      {/* Before and after */}
      {p.compare.length ? (
        <section className={`inverse ${s.compareBand}`} aria-label={strings.compare.title}>
          <Compare pairs={p.compare} strings={strings.compare} lang={lang} scroller={scroller} />
        </section>
      ) : null}

      {/* Why it matters, the outcome, then the photographs */}
      <div className={`light ${s.body}`}>
        {p.story ? (
          <section className={s.split} aria-labelledby="chapter-why">
            <h3 id="chapter-why" className={`t-micro ${s.label}`} data-rise>
              {strings.chapters.why}
            </h3>
            <div className={s.splitMain}>
              <p className={s.whyText} data-reveal>
                <Words text={p.story.why} />
              </p>
              <div className={s.chapter} data-rise>
                <h4 className={s.chapterLabel}>{strings.chapters.outcome}</h4>
                <p className={s.chapterText}>{p.story.outcome}</p>
              </div>
            </div>
          </section>
        ) : null}
        <Gallery gallery={p.gallery} indices={shown} notes={strings.notes} lang={lang} onOpen={setViewer} />
      </div>

      {/* Project details, held while the other projects slide up over them */}
      <div className={s.cover}>
        <div className={`light ${s.body} ${s.coverUnder}`} data-cover-under>
          <div data-cover-inner>
            <section className={`${s.split} ${s.details}`} aria-labelledby="project-details">
              <h3 id="project-details" className={`t-micro ${s.label}`} data-rise>
                {strings.details}
              </h3>
              <div className={s.splitMain}>
                {p.story ? (
                  <div className={s.chapter} data-rise>
                    <h4 className={s.chapterLabel}>{strings.chapters.approach}</h4>
                    <p className={s.chapterText}>{p.story.approach}</p>
                  </div>
                ) : null}
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
        </div>

        {others.length ? (
          <section className={`inverse ${s.others} ${s.coverOver}`} data-cover-over aria-labelledby="project-others">
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
      </div>

      {/* The site footer; any link in it leaves the overlay for the page it points to */}
      <div
        className={s.footerSlot}
        onClickCapture={(e) => {
          if ((e.target as Element).closest("a")) onLeave();
        }}
      >
        {footer}
      </div>

      {viewer !== null ? (
        <Lightbox items={p.gallery} start={viewer} tileFor={tileFor} onClose={() => setViewer(null)} strings={strings.gallery} lang={lang} />
      ) : null}
    </div>
  );
}
