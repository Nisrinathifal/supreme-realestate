import styles from "./Mark.module.css";

type Props = { size?: number; className?: string; decorative?: boolean; title?: string };

/**
 * Hexagon S mark (client logo, 2026-09-29), redrawn as vector geometry and recoloured to the brand:
 * the primary stroke follows currentColor (Canal ink on light, Paper on dark), the second band uses
 * --mark-2 (Graphite on light, Sage in inverse bands). No gradients: matte, flat, precise.
 */
export function Mark({ size = 32, className, decorative = false, title = "Supreme" }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={[styles.mark, className].filter(Boolean).join(" ")}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <g fill="none" strokeWidth="13" strokeLinejoin="miter" strokeMiterlimit="8">
        {/* upper part of the S: left shoulder, roof, right flank, bar into the centre */}
        <path d="M13.5,50 V29.5 L50,8.5 L86.5,29.5 V42.5 H43" stroke="currentColor" />
        {/* lower part of the S: right flank, floor, left flank, bar into the centre */}
        <path d="M86.5,50 V70.5 L50,91.5 L13.5,70.5 V57.5 H57" stroke="var(--mark-2, currentColor)" />
      </g>
    </svg>
  );
}
