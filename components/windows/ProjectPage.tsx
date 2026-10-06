"use client";

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowRight, ArrowsOut } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { gsap, MQ, ScrollTrigger, setupGsap } from "@/lib/motion";
import { Compare } from "./Compare";
import { Lightbox } from "./Lightbox";
import type { PageStrings, WindowProject } from "./types";
import s from "./project.module.css";

type Props = {
  project: WindowProject;
  next: WindowProject;
  lang: Lang;
  strings: PageStrings;
  scroller: RefObject<HTMLDivElement | null>;
  /** The overlay has finished entering: measurements are final. */
  live: boolean;
  onNext: (id: string) => void;
};

type Chapter = {
  key: "opportunity" | "approach" | "outcome";
  text: string;
  image: ImageAsset | null;
};

/** Gallery rows in twelfths: a wide-and-narrow pair, then a three-up, then the pair mirrored; never one photo alone. */
const ROWS = [
  [7, 5],
  [4, 4, 4],
  [5, 7],
  [4, 4, 4],
];
function galleryRows(n: number) {
  const rows: number[][] = [];
  let i = 0;
  let k = 0;
  while (i < n) {
    const left = n - i;
    let row = ROWS[k++ % ROWS.length];
    if (left === 1) row = [12];
    else if (left === 2) row = [6, 6];
    else if (left - row.length === 1) row = row.length === 2 ? [4, 4, 4] : [7, 5];
    rows.push(row);
    i += row.length;
  }
  return rows;
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

/**
 * The project page (2026-10-06), the overlay's continuation under the room: a Paper sheet rises over the interior
 * with the discreet headline, the lede and the facts; the story in three chapters beside one held photograph that
 * turns, chapter by chapter, from the property as found to the finished room (a thin rail marks where you are);
 * before and after on Canal ink (Compare); every photograph in an editorial grid that opens into the viewer
 * (Lightbox); and why it matters, with the way on to the next project. All scroll motion runs on the overlay's own
 * scroller (Lenis is off in there); reduced motion keeps every state final and only the held photograph swaps.
 */
export function ProjectPage({ project, next, lang, strings, scroller, live, onNext }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const p = project;
  const pairs = p.compare;
  const g = p.gallery.map((x) => x.image);

  // The held photograph per chapter: as found, during, finished (archive pairs where there are any)
  const chapters: Chapter[] = p.story
    ? [
        {
          key: "opportunity",
          text: p.story.opportunity,
          image: pairs[0]?.before ?? g[1] ?? null,
        },
        {
          key: "approach",
          text: p.story.approach,
          image: pairs[1]?.before ?? g[2] ?? null,
        },
        {
          key: "outcome",
          text: p.story.outcome,
          image: pairs[0]?.after ?? g[3] ?? g[0] ?? null,
        },
      ]
    : [];
  const rows = galleryRows(p.gallery.length);
  const rowStart = rows.map((_, r) => rows.slice(0, r).reduce((n, row) => n + row.length, 0));

  const tileFor = useCallback((i: number) => root.current?.querySelector<HTMLElement>(`[data-tile="${i}"]`) ?? null, []);
  const toChapter = (i: number) => root.current?.querySelector<HTMLElement>(`[data-chapter="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  useLayoutEffect(() => {
    setupGsap();
    const el = root.current;
    const sc = scroller.current;
    if (!el || !sc) return;
    const triggers: ScrollTrigger[] = [];
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const st = (vars: ScrollTrigger.Vars) => ({ scroller: sc, ...vars });

      // Where you are in the story: the chapter in the middle of the view holds the photograph (also under reduced motion)
      q<HTMLElement>("[data-chapter]").forEach((ch, i) => {
        triggers.push(
          ScrollTrigger.create(
            st({
              trigger: ch,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => self.isActive && setActive(i),
            }),
          ),
        );
      });

      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        // The room's name steps back as the sheet comes up over it
        const title = sc.querySelector<HTMLElement>("[data-project-focus]");
        const sheet = q<HTMLElement>("[data-project-sheet]")[0];
        if (title && sheet)
          gsap.to(title, {
            y: -48,
            opacity: 0,
            ease: "none",
            scrollTrigger: st({
              trigger: sheet,
              start: "top bottom",
              end: "top 35%",
              scrub: true,
            }),
          });

        // The headline block arrives once, line by line
        const rise = q<HTMLElement>("[data-rise]");
        gsap.fromTo(
          rise,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: st({ trigger: sheet, start: "top 70%", once: true }),
          },
        );

        // Each chapter (and the closing line) fills in from Graphite to ink with the scroll
        const from = getComputedStyle(el).getPropertyValue("--reveal-from").trim();
        q<HTMLElement>("[data-reveal]").forEach((block) => {
          const words = block.querySelectorAll<HTMLElement>("[data-word]");
          gsap.fromTo(
            words,
            { color: from },
            {
              color: getComputedStyle(block).color,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: st({
                trigger: block,
                start: "top 82%",
                end: "bottom 50%",
                scrub: true,
              }),
            },
          );
        });

        // The rail fills as the story is read
        const fill = q<HTMLElement>("[data-rail-fill]")[0];
        const story = q<HTMLElement>("[data-story]")[0];
        if (fill && story)
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: st({
                trigger: story,
                start: "top 55%",
                end: "bottom 55%",
                scrub: true,
              }),
            },
          );

        // The before/after frame opens to full width as it arrives
        const frame = q<HTMLElement>("[data-compare-frame]")[0];
        if (frame)
          gsap.fromTo(
            frame,
            { clipPath: "inset(0% 6% 0% 6% round 32px)" },
            { clipPath: "inset(0% 0% 0% 0% round 24px)", ease: "none", scrollTrigger: st({ trigger: frame, start: "top bottom", end: "top 35%", scrub: true }) },
          );

        // Photographs uncover from below as they come into view, once
        q<HTMLElement>("[data-tile]").forEach((tile) => {
          const img = tile.querySelector("img");
          const tl = gsap.timeline({
            scrollTrigger: st({ trigger: tile, start: "top 92%", once: true }),
          });
          tl.fromTo(
            tile,
            { clipPath: "inset(18% 0% 0% 0% round 24px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 24px)",
              duration: 1.1,
              ease: "power3.out",
              clearProps: "clipPath",
            },
            0,
          );
          if (img)
            tl.fromTo(
              img,
              { scale: 1.14 },
              {
                scale: 1,
                duration: 1.4,
                ease: "power3.out",
                clearProps: "transform",
              },
              0,
            );
        });
      });
      return () => mm.revert();
    }, el);
    return () => {
      triggers.forEach((t) => t.kill());
      ctx.revert();
    };
  }, [scroller]);

  // Measurements settle once the overlay's enter timeline has finished (it moves the scroller)
  useLayoutEffect(() => {
    if (!live || !scroller.current) return;
    ScrollTrigger.getAll()
      .filter((t) => t.scroller === scroller.current)
      .forEach((t) => t.refresh());
  }, [live, scroller]);

  const facts = [
    { k: strings.facts.project, v: p.name },
    { k: strings.facts.city, v: p.location },
    { k: strings.facts.category, v: p.category },
    { k: strings.facts.country, v: p.country },
  ];

  return (
    <div ref={root} className={s.page}>
      <article className={`light ${s.sheet}`} data-project-sheet aria-labelledby="project-page-title">
        <header className={s.intro}>
          <div className={s.introMain}>
            <p className={`t-micro ${s.kicker}`} data-rise>
              {p.category} · {p.location}
            </p>
            <h3 id="project-page-title" className={s.title} data-rise>
              {p.title}
            </h3>
            {p.lede ? (
              <p className={s.lede} data-rise>
                {p.lede}
              </p>
            ) : null}
          </div>
          <dl className={s.facts} data-rise>
            {facts.map((f) => (
              <div key={f.k} className={s.fact}>
                <dt className="t-micro">{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {chapters.length ? (
          <section className={s.story} data-story aria-label={p.title}>
            <div className={s.held} aria-hidden="true">
              <div className={s.heldFrame}>
                {chapters.map((c, i) => (
                  <div key={c.key} className={s.heldLayer} data-on={i <= active ? "true" : "false"} style={{ zIndex: i + 1 } as CSSProperties}>
                    <MediaFrame image={c.image} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 1px, 40vw" decorative />
                  </div>
                ))}
              </div>
              <div className={s.rail}>
                <span className={s.railTrack}>
                  <span className={s.railFill} data-rail-fill />
                </span>
                <ol className={s.railList}>
                  {chapters.map((c, i) => (
                    <li key={c.key}>
                      <button type="button" tabIndex={-1} className={s.railItem} data-on={i === active ? "true" : "false"} onClick={() => toChapter(i)}>
                        {strings.chapters[c.key]}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className={s.chapters}>
              {chapters.map((c, i) => (
                <section key={c.key} className={s.chapter} data-chapter={i} aria-labelledby={`chapter-${c.key}`}>
                  {c.image ? (
                    <MediaFrame image={c.image} ratio="16/9" lang={lang} radius="lg" sizes="(max-width: 767px) 100vw, 1px" className={s.chapterImage} />
                  ) : null}
                  <h4 id={`chapter-${c.key}`} className={`t-micro ${s.chapterLabel}`}>
                    {strings.chapters[c.key]}
                  </h4>
                  <p className={s.chapterText} data-reveal>
                    <Words text={c.text} />
                  </p>
                </section>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      {pairs.length ? (
        <section className={`inverse ${s.compareBand}`} aria-label={strings.compare.title}>
          <div className={s.compareWrap} data-compare-wrap>
            <Compare pairs={pairs} strings={strings.compare} lang={lang} scroller={scroller} />
          </div>
        </section>
      ) : null}

      <section className={`light ${s.gallery}`} aria-labelledby="project-gallery-title">
        <div className={s.galleryHead}>
          <h3 id="project-gallery-title" className={s.bandTitle}>
            {strings.gallery.title}
          </h3>
          <p className="t-micro">{p.galleryCount}</p>
        </div>
        <div className={s.grid}>
          {rows.map((row, r) => (
            <div
              key={r}
              className={s.row}
              data-count={row.length}
              style={
                {
                  "--cols": row.map((c) => `${c}fr`).join(" "),
                } as CSSProperties
              }
            >
              {row.map((_, c) => {
                const i = rowStart[r] + c;
                const item = p.gallery[i];
                return (
                  <button key={i} type="button" className={s.tile} data-tile={i} onClick={() => setViewer(i)} aria-label={item.open}>
                    <MediaFrame image={item.image} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 100vw, 60vw" />
                    <span className={s.tileIcon} aria-hidden="true">
                      <ArrowsOut size={16} weight="light" />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className={`inverse ${s.closing}`} aria-labelledby="chapter-why">
        {p.story ? (
          <div className={s.why}>
            <h4 id="chapter-why" className="t-micro">
              {strings.chapters.why}
            </h4>
            <p className={s.whyText} data-reveal>
              <Words text={p.story.why} />
            </p>
          </div>
        ) : null}
        {next.id !== p.id ? (
          <button type="button" className={s.next} onClick={() => onNext(next.id)}>
            <span className={s.nextText}>
              <span className="t-micro">{strings.next}</span>
              <span className={s.nextName}>{next.name}</span>
              <span className={s.nextMeta}>{next.title}</span>
            </span>
            <span className={s.nextMedia} aria-hidden="true">
              <MediaFrame image={next.preview} ratio="fill" lang={lang} radius="none" sizes="(max-width: 767px) 90vw, 30vw" decorative />
            </span>
            <span className={s.nextArrow} aria-hidden="true">
              <ArrowRight size={22} weight="light" />
            </span>
          </button>
        ) : null}
      </section>

      {viewer !== null ? (
        <Lightbox items={p.gallery} start={viewer} tileFor={tileFor} onClose={() => setViewer(null)} strings={strings.gallery} lang={lang} />
      ) : null}
    </div>
  );
}
