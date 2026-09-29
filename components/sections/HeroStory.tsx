"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import type { VideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Hero.module.css";

type Cue = { at: number; text: string };
type Props = {
  film: VideoAsset;
  lang: Lang;
  sequence: Cue[];
  headline: string;
  keyMessage: string;
  labels: { pause: string; play: string };
};

/** "static": key message only (server render, no JS, reduced motion, autoplay refused). */
type Phase = { kind: "static" } | { kind: "sequence"; index: number } | { kind: "done" };

/**
 * Hero story (sky band above the uncropped film): the film plays once; words appear one at a time in sync with it (forgotten, old, run-down,
 * valuable, worth living in); when the film ends the header settles on the headline (H1) with the key message as
 * body text. H1 and body are always in the DOM for screen readers; the sequence words are decorative (aria-hidden).
 * Without JS, and under reduced motion, headline and body show with the final frame of the film.
 */
export function HeroStory({ film, lang, sequence, headline, keyMessage, labels }: Props) {
  const hasFilm = Boolean(film.mp4 || film.webm);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "static" });
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasFilm) return;
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    const chosen = (mobile && film.mp4Mobile) || film.mp4 || film.webm;
    if (chosen && !v.currentSrc.endsWith(chosen)) {
      v.src = chosen;
      v.load();
    }

    const cueIndex = (t: number) => {
      let i = 0;
      for (let k = 0; k < sequence.length; k++) if (t >= sequence[k].at) i = k;
      return i;
    };
    const onTime = () => {
      if (v.ended) return;
      setPhase((p) => {
        const index = cueIndex(v.currentTime);
        return p.kind === "sequence" && p.index === index ? p : { kind: "sequence", index };
      });
    };
    const onEnded = () => setPhase({ kind: "done" });

    // Reduced motion / Save-Data: no playback; show the finished frame with the key message.
    if (prefersReducedMotion() || saveData()) {
      v.pause();
      const toEnd = () => {
        if (Number.isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05);
      };
      const onSeeked = () => setRevealed(true);
      if (v.readyState >= 1) toEnd();
      v.addEventListener("loadedmetadata", toEnd, { once: true });
      v.addEventListener("seeked", onSeeked, { once: true });
      return () => {
        v.removeEventListener("loadedmetadata", toEnd);
        v.removeEventListener("seeked", onSeeked);
      };
    }

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    const start = () => {
      if (!v.paused || v.ended) return;
      v.play().then(
        () => v.setAttribute("data-autoplay", "ok"),
        () => {
          // Autoplay refused: keep the key message, the hidden control can still start the film.
          v.setAttribute("data-autoplay", "refused");
          setPhase({ kind: "static" });
        },
      );
    };
    if (v.readyState >= 3) start();
    v.addEventListener("canplay", start, { once: true });
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("canplay", start);
    };
  }, [hasFilm, film.mp4, film.mp4Mobile, film.webm, sequence]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.ended) {
        v.currentTime = 0;
        setPhase({ kind: "sequence", index: 0 });
      }
      v.play().catch(() => undefined);
    } else v.pause();
  };

  const showKey = phase.kind !== "sequence";
  return (
    <>
      <div className={styles.media} data-hero-media>
        <MediaFrame image={film.poster} ratio="fill" lang={lang} radius="none" priority decorative className={styles.poster} />
        {hasFilm ? (
          <video
            ref={videoRef}
            className={styles.video}
            data-revealed={revealed ? "true" : "false"}
            autoPlay
            muted
            playsInline
            preload="metadata"
            poster={film.poster ? `/media/${film.poster.src}-1280.jpg` : undefined}
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => {
              setPlaying(true);
              setRevealed(true);
            }}
            onPlay={(e) => {
              // Sequence mode starts the moment playback starts (autoplay or replay)
              const t = e.currentTarget.currentTime;
              let index = 0;
              for (let k = 0; k < sequence.length; k++) if (t >= sequence[k].at) index = k;
              if (!prefersReducedMotion()) setPhase({ kind: "sequence", index });
            }}
            onPause={() => setPlaying(false)}
          >
            {film.webm ? <source src={film.webm} type="video/webm" /> : null}
            {film.mp4 ? <source src={film.mp4} type="video/mp4" /> : null}
          </video>
        ) : null}
        {/* real element after the video: a ::before on the wrapper does not reliably paint above a video layer */}
        <div className={styles.seam} aria-hidden="true" />
      </div>

      <div className={styles.copy}>
        <div className={styles.clouds} aria-hidden="true" />
        <div className={styles.stack}>
          <p className={styles.sequence} aria-hidden="true">
            {sequence.map((cue, i) => (
              <span key={cue.at} className={styles.word} data-on={phase.kind === "sequence" && phase.index === i ? "true" : "false"}>
                {cue.text}
              </span>
            ))}
          </p>
          <div className={styles.final} data-on={showKey ? "true" : "false"}>
            <h1 id="hero-title" className={styles.title}>
              {headline}
            </h1>
            <p className={styles.lead}>{keyMessage}</p>
          </div>
        </div>
      </div>

      {hasFilm ? (
        // Visually hidden until keyboard focus: keeps the WCAG 2.2.2 pause mechanism without a visible pill.
        <button type="button" className={styles.control} onClick={toggle} aria-pressed={playing}>
          {playing ? <Pause size={18} weight="light" aria-hidden="true" /> : <Play size={18} weight="light" aria-hidden="true" />}
          <span>{playing ? labels.pause : labels.play}</span>
        </button>
      ) : null}
    </>
  );
}
