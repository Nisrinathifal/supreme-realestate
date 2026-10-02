"use client";

import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./WorkCompare.module.css";

type Props = { before: ImageAsset; after: ImageAsset; lang: Lang; labels: { before: string; after: string; label: string } };

/**
 * Before/after comparison after the reference: the finished state on the left, the old state on the right, a
 * vertical divider with a round handle between them. Drag anywhere on the picture or use the arrow keys (the handle
 * is a range input). When the card comes on screen the finished state wipes in to the middle; reduced motion
 * shows it there at once. Without JavaScript the two pictures sit side by side at the middle.
 */
export function WorkCompare({ before, after, lang, labels }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  // Entrance: from fully "before" to the middle, once, when a quarter of the card is visible
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setPos(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), dur = 1100;
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / dur);
          const ease = 1 - Math.pow(1 - k, 3);
          setPos(50 * ease);
          if (k < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
  }, []);

  const fromEvent = (clientX: number) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    cancelAnimationFrame(raf.current);
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    fromEvent(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => { if (dragging.current) fromEvent(e.clientX); };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div
      ref={root}
      className={styles.compare}
      style={{ "--pos": `${pos}%` } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className={styles.layer}>
        <MediaFrame image={before} ratio="fill" lang={lang} radius="none" sizes="100vw" />
      </div>
      <div className={`${styles.layer} ${styles.after}`}>
        <MediaFrame image={after} ratio="fill" lang={lang} radius="none" sizes="100vw" />
      </div>
      <span className={`t-micro ${styles.tag} ${styles.tagAfter}`}>{labels.after}</span>
      <span className={`t-micro ${styles.tag} ${styles.tagBefore}`}>{labels.before}</span>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.handle}>
          <CaretLeft size={14} weight="bold" />
          <CaretRight size={14} weight="bold" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => { cancelAnimationFrame(raf.current); setPos(Number(e.target.value)); }}
        aria-label={labels.label}
        className={styles.range}
      />
    </div>
  );
}
