import { gableOutline, HEIGHT, HOUSE, WINDOW, windowSlots } from "@/lib/supreme/buildingStates";
import styles from "./SupremeHero.module.css";

export type StageCopy = { label: string; title: string; body: string | null };

/**
 * The six stages as text (SCENE-3D.md §3): index, label, the line, and the chapter's body where one belongs. With the
 * scene running they are panels that SupremeHero brings in one at a time, on alternate sides (the model is framed on
 * the other); without it they are a plain list. A six-dot rail marks the stage reached.
 */
export function TransformationTimeline({ stages, close }: { stages: StageCopy[]; close: string }) {
  return (
    <>
      <ol className={styles.stages}>
        {stages.map((st, i) => (
          <li key={i} className={`${styles.stageItem} ${i % 2 === 0 ? styles.left : styles.right}`} data-film-stage-text={i}>
            <span className={`t-micro ${styles.index}`}>
              {String(i + 1).padStart(2, "0")} · {st.label}
            </span>
            <h3 className={styles.stageTitle}>{st.title}</h3>
            {st.body ? <p className={styles.stageBody}>{st.body}</p> : null}
            {i === stages.length - 1 ? <p className={styles.close}>{close}</p> : null}
          </li>
        ))}
      </ol>
      <ol className={styles.rail} aria-hidden="true">
        {stages.map((st, i) => (
          <li key={i} className={styles.dot} data-film-dot={i}>
            <span>{st.label}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * The fallback picture (phones, reduced motion, no WebGL, no JS): the same canal house as the 3D model, drawn as an
 * elevation in SVG from the same data, with its floor levels and height dimensioned.
 */
export function Elevation() {
  const pad = 2.5;
  const top = HEIGHT + HOUSE.gableHeight;
  const half = HOUSE.width / 2;
  const vb = `${-half - pad - 1.5} ${-top - pad} ${HOUSE.width + 2 * pad + 3} ${top + 2 * pad}`;
  const y = (v: number) => -v; // SVG y grows down
  const outline = [[-half, 0], ...gableOutline(), [half, 0]].map(([a, b]) => `${a},${y(b)}`).join(" ");
  const windows = windowSlots().filter((s) => s.face === "front");
  const levels = Array.from({ length: HOUSE.floors + 1 }, (_, f) => f * HOUSE.floorHeight);
  return (
    <svg className={styles.elevation} viewBox={vb} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <g fill="none" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {levels.map((l) => (
          <line key={l} x1={-half - 1.2} x2={half + 1.2} y1={y(l)} y2={y(l)} className={styles.svgLevel} />
        ))}
        <polygon points={outline} className={styles.svgWall} />
        {windows.map((w, i) => (
          <rect key={i} x={w.x - WINDOW.width / 2} y={y(w.y + w.h / 2)} width={WINDOW.width} height={w.h} className={styles.svgWindow} />
        ))}
        <line x1={half + 1.6} x2={half + 1.6} y1={0} y2={y(HEIGHT)} className={styles.svgDim} />
        <line x1={half + 1.3} x2={half + 1.9} y1={0} y2={0} className={styles.svgDim} />
        <line x1={half + 1.3} x2={half + 1.9} y1={y(HEIGHT)} y2={y(HEIGHT)} className={styles.svgDim} />
        <line x1={-half - pad} x2={half + pad} y1={0} y2={0} className={styles.svgGround} />
      </g>
    </svg>
  );
}
