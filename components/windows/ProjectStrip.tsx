"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { Lang } from "@/content/routes";
import { ENTER_PROJECT, type WindowProject } from "./Windows";
import s from "./windows.module.css";

type Props = { lang: Lang; projects: WindowProject[]; strings: { index: string; more: string } };

/**
 * Phones: the film is cropped to its middle, so three of the four windows fall off the screen. Instead the four
 * projects stand in a row under the hero; a tap enters the same overlay, pushing in from the card (Windows listens
 * for ENTER_PROJECT). Hidden on wider screens, where the windows themselves are the way in.
 */
export function ProjectStrip({ lang, projects, strings }: Props) {
  return (
    <section className={s.strip} aria-label={strings.index}>
      <div className={s.stripHead}>
        <p className="t-micro">{strings.index}</p>
        <h2 className={s.stripTitle}>{strings.more}</h2>
      </div>
      <ul className={s.stripList}>
        {projects
          .filter((p) => p.interior)
          .map((p) => (
            <li key={p.id} className={s.stripItem}>
              <button
                type="button"
                className={s.stripCard}
                aria-label={p.label}
                onClick={(e) => document.dispatchEvent(new CustomEvent(ENTER_PROJECT, { detail: { id: p.id, from: e.currentTarget } }))}
              >
                <MediaFrame image={p.preview} ratio="4/5" lang={lang} radius="lg" sizes="60vw" decorative />
                <span className={s.stripText}>
                  <span className={s.stripName}>{p.name}</span>
                  <span className={s.stripMeta}>{p.location}</span>
                </span>
                <ArrowRight size={18} weight="light" className={s.stripArrow} aria-hidden="true" />
              </button>
            </li>
          ))}
      </ul>
    </section>
  );
}
