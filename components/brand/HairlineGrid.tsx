import styles from "./HairlineGrid.module.css";

/** 12 column guides as 1px lines (DESIGN §5). Decorative; drawn in once by motion (M2). */
export function HairlineGrid({ columns = 12 }: { columns?: number }) {
  return (
    <div className={`${styles.grid} container`} aria-hidden="true" data-hairline-grid>
      {Array.from({ length: columns + 1 }).map((_, i) => (
        <span key={i} className={styles.line} data-hairline />
      ))}
    </div>
  );
}
