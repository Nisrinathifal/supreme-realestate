import styles from "./Mark.module.css";

type Props = { size?: number; className?: string; decorative?: boolean; title?: string };

/** Dak-S mark (DESIGN §6). Stroke follows currentColor; the window uses --win (lime only on dark). */
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
      <path d="M82,50 V40 L50,12 L18,40 V60 H82 V92 H18 V80" fill="none" stroke="currentColor" strokeWidth="11" strokeLinejoin="round" />
      <rect x="45" y="33" width="10" height="10" rx="1.5" fill="var(--win, currentColor)" />
    </svg>
  );
}
