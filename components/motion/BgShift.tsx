"use client";

import { useEffect } from "react";
import { ScrollTrigger, setupGsap } from "@/lib/motion";
import { usePublicPathname } from "@/lib/usePublicPathname";

/** Where on the screen a band takes over the page's tone: when its top passes this line (share of the viewport). The
 *  header turns with it over bands that fill with the tone (Header, WorkMotion). */
export const TONE_LINE = 0.6;
/** The line at which a band takes over the tone: TONE_LINE plus its own lead (`data-tone-lead`), at most the screen's foot. */
export const toneLine = (band: Element | null | undefined) => Math.min(1, TONE_LINE + Number((band as HTMLElement | null)?.dataset?.toneLead ?? 0));

/**
 * The page's tone, after brandappart.com (owner, 2026-10-08: no hard gradients between light and dark bands). Bands
 * say which tone they are (`data-tone="dark" | "paper"`); the one crossing the line TONE_LINE down the screen sets
 * `<html data-page-tone>`, and every band that fills with the tone (`data-tone-fill`) paints `--tone-now`, a
 * registered colour that the root eases from one tone to the other (tokens.css), so the whole screen changes colour
 * together, the way a room's light changes, instead of one band fading into the next. A band may take over as soon
 * as it enters (`data-tone-lead`, a share of the viewport added to TONE_LINE; negative = later, e.g. a band that slides
 * up over the one before it takes over only once it has covered it). Pinned bands count their pin.
 * Without JS the bands keep their own grounds and simply meet.
 */
export function BgShift() {
  const pathname = usePublicPathname();
  useEffect(() => {
    setupGsap();
    const root = document.documentElement;
    const bands = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]"));
    if (!bands.length) return;
    root.setAttribute("data-bg-shift", "");
    root.dataset.pageTone = bands[0].dataset.tone;
    const pinOf = (band: HTMLElement) => ScrollTrigger.getAll().find((t) => t.pin === band);
    const active = new Set<HTMLElement>();
    // The last band in the page's order that is under the line wins (two can overlap while one slides over another)
    const apply = () => {
      const on = bands.filter((b) => active.has(b));
      const tone = on.length ? on[on.length - 1].dataset.tone : undefined;
      if (tone && root.dataset.pageTone !== tone) root.dataset.pageTone = tone;
    };
    const triggers = bands.map((band) =>
      ScrollTrigger.create({
        trigger: band,
        start: () => {
          const pin = pinOf(band);
          const top = pin ? pin.start : band.getBoundingClientRect().top + window.scrollY;
          return top - window.innerHeight * toneLine(band);
        },
        end: () => {
          const pin = pinOf(band);
          const bottom = pin ? pin.end + band.offsetHeight : band.getBoundingClientRect().bottom + window.scrollY;
          const next = bands[bands.indexOf(band) + 1];
          return bottom - window.innerHeight * (next ? toneLine(next) : TONE_LINE);
        },
        refreshPriority: -1, // after the pins, so their ranges are final
        onToggle: (self) => {
          if (self.isActive) active.add(band);
          else active.delete(band);
          apply();
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      root.removeAttribute("data-bg-shift");
      delete root.dataset.pageTone;
    };
  }, [pathname]);
  return null;
}
