import styles from "./Columns.module.css";

type Props = { tone?: "paper" | "stone"; className?: string; [key: `data-${string}`]: string | undefined };

/**
 * Two registers of vertical bands of one width on one period, as in the reference: from about 46% down the
 * second register is offset by half a period and has rounded tops. The period divides the width, so the
 * pattern is symmetrical.
 */
const PERIOD = 180;
const BREAK = 414; // of 900
const BAND = 92;
const upper = Array.from({ length: 8 }, (_, k) => 90 + k * PERIOD);
const lower = Array.from({ length: 9 }, (_, k) => k * PERIOD);

/**
 * Background treatment: faint architectural columns behind a band (after the owner's reference).
 * One tone darker than the surface it sits on (Paper → Stone, Stone → line), very low contrast, no gradient.
 * Decorative, behind all content, scales with the band.
 */
export function Columns({ tone = "paper", className, ...rest }: Props) {
  return (
    <svg
      className={[styles.columns, tone === "stone" ? styles.stone : styles.paper, className].filter(Boolean).join(" ")}
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {upper.map((cx) => (
        <rect key={`u${cx}`} x={cx - BAND / 2} y={0} width={BAND} height={BREAK + 6} />
      ))}
      {lower.map((cx) => (
        <rect key={`l${cx}`} x={cx - BAND / 2} y={BREAK} width={BAND} height={900 - BREAK} rx={14} />
      ))}
    </svg>
  );
}
