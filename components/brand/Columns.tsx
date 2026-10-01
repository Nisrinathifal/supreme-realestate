import styles from "./Columns.module.css";

type Props = { tone?: "paper" | "stone"; className?: string };

/** Eight pillars, mirrored around the centre: narrow shaft, a wider base from 60% down, soft shoulders. */
const half = [
  { cx: 90, top: 70, base: 124 },
  { cx: 270, top: 56, base: 100 },
  { cx: 450, top: 84, base: 136 },
  { cx: 630, top: 48, base: 92 },
];
const pillars = [...half, ...half.map((p) => ({ ...p, cx: 1440 - p.cx }))];

/**
 * Background treatment: faint vertical architectural columns behind a band (after the owner's reference).
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
      {pillars.map((p) => (
        <g key={p.cx}>
          <rect x={p.cx - p.top / 2} y={0} width={p.top} height={560} />
          <rect x={p.cx - p.base / 2} y={536} width={p.base} height={364} rx={18} />
        </g>
      ))}
    </svg>
  );
}
