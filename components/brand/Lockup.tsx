import Link from "next/link";
import styles from "./Lockup.module.css";

type Props = { href?: string; wordmark?: string; descriptor?: string; ariaLabel: string; className?: string; height?: number };

/**
 * Logo lockup: the client-supplied artwork (public/brand/logo-lockup.png, background made transparent,
 * otherwise untouched). Mark + "SUPREME REAL ESTATE" are part of the image; the text props are kept
 * for the accessible name only. Never boxed, never recoloured.
 */
export function Lockup({ href, ariaLabel, className, height = 36 }: Props) {
  // 1337×398 source: keep the aspect ratio for width/height attributes (no layout shift)
  const width = Math.round((height * 1337) / 398);
  // inline height: the global `img { height: auto }` reset would otherwise override the attribute
  const img = <img src="/brand/logo-lockup.png" alt="" width={width} height={height} style={{ height, width }} className={styles.img} decoding="async" />;
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
