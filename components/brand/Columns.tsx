import styles from "./Columns.module.css";

type Props = { tone?: "paper" | "stone"; className?: string };

/**
 * Two registers of vertical bands on one period, as in the reference: the upper register of narrow bands,
 * and from about 46% down a second register offset by half a period, a little wider, with rounded tops.
 * The period divides the width, so the pattern is symmetrical.
 */
const PERIOD = 180;
const BREAK = 414; // of 900
const upper = Array.from({ length: 8 }, (_, k) => 90 + k * PERIOD);
const lower = Array.from({ length: 9 }, (_, k) => k * PERIOD);

/**
 * Background treatment: faint architectural columns behind a band (after the owner's reference).
 * One tone darker than the surface it sits on (Paper → Stone, Stone → line), very low contrast, no gradient.
 * Decorative, behind all content, scales with the band.
 */
export function Columns({ tone = "paper", className }: Props) {
  return (
    <svg
      className={[styles.columns, tone === "stone" ? styles.stone : styles.paper, className].filter(Boolean).join(" ")}
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {upper.map((cx) => (
        <rect key={`u${cx}`} x={cx - 40} y={0} width={80} height={BREAK + 6} />
      ))}
      {lower.map((cx) => (
        <rect key={`l${cx}`} x={cx - 52} y={BREAK} width={104} height={900 - BREAK} rx={14} />
      ))}
    </svg>
  );
}
