import Link from "next/link";
import { Mark } from "./Mark";
import styles from "./Lockup.module.css";

type Props = { href?: string; wordmark: string; descriptor?: string; ariaLabel: string; className?: string };

/** Header/footer lockup: mark + typeset wordmark (DESIGN §6). Never boxed. */
export function Lockup({ href, wordmark, descriptor, ariaLabel, className }: Props) {
  const inner = (
    <>
      <Mark size={32} decorative />
      <span className={styles.text}>
        <span className={styles.wordmark}>{wordmark}</span>
        {descriptor ? <span className={styles.descriptor}>{descriptor}</span> : null}
      </span>
    </>
  );
  const cls = [styles.lockup, className].filter(Boolean).join(" ");
  return href ? (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {inner}
    </Link>
  ) : (
    <span className={cls} aria-label={ariaLabel} role="img">
      {inner}
    </span>
  );
}
