import styles from "./RoofFrame.module.css";
import type { ReactNode } from "react";

/** Media frame with a pitched top edge (DESIGN §8). One per view; never on video or small tiles. */
export function RoofFrame({ children, outline = false, className }: { children?: ReactNode; outline?: boolean; className?: string }) {
  return (
    <div className={[styles.roof, outline ? styles.outline : "", className].filter(Boolean).join(" ")}>
      {outline ? (
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true" className={styles.svg}>
          <path d="M0.5,11.3 L50,0.5 L99.5,11.3 L99.5,59.5 L0.5,59.5 Z" fill="none" stroke="currentColor" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        children
      )}
    </div>
  );
}
