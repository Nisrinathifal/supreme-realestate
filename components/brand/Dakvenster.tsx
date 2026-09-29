import styles from "./Dakvenster.module.css";

/** The small window square used as signal: active-nav dot, bullet, separator (DESIGN §8). Max 14px. */
export function Dakvenster({ size = 6, className }: { size?: 6 | 8 | 10 | 12 | 14; className?: string }) {
  return <span aria-hidden="true" className={[styles.win, className].filter(Boolean).join(" ")} style={{ width: size, height: size }} />;
}
