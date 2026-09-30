import Link from "next/link";
import styles from "./Lockup.module.css";

type Props = { href?: string; wordmark?: string; descriptor?: string; ariaLabel: string; className?: string; height?: number };

/**
 * Logo lockup: the horizontal roof-S lockup supplied 2026-09-30 (public/brand/logo-lockup.svg, ink mono).
 * Roof mark + "SUPREME" + "REAL ESTATE" are part of the artwork; the text props are kept for the
 * accessible name only. Never boxed, never recoloured.
 */
export function Lockup({ href, ariaLabel, className, height = 36 }: Props) {
  // 543.05×141.39 viewBox: keep the aspect ratio for width/height attributes (no layout shift)
  const width = Math.round((height * 543.05) / 141.39);
  // inline height: the global `img { height: auto }` reset would otherwise override the attribute
  // Plain <img>: small fixed-size vector logo, explicit dimensions, no optimisation needed.
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src="/brand/logo-lockup.svg" alt="" width={width} height={height} style={{ height, width }} className={styles.img} decoding="async" />;
  const cls = [styles.lockup, className].filter(Boolean).join(" ");
  return href ? (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {img}
    </Link>
  ) : (
    <span className={cls} role="img" aria-label={ariaLabel}>
      {img}
    </span>
  );
}
