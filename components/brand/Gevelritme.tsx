import styles from "./Gevelritme.module.css";

/** Facade rhythm divider between light sections (DESIGN §8). Decorative. */
export function Gevelritme({ count = 24 }: { count?: number }) {
  return (
    <div className={styles.row} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={styles.bar} />
      ))}
    </div>
  );
}
