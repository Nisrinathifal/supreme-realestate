import styles from "./Wordmark.module.css";

/** Giant footer wordmark (DESIGN §9.12). Letters wrapped for the rise animation; clipped by overflow. */
export function Wordmark({ text }: { text: string }) {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.word}>
        {text.split("").map((ch, i) => (
          <span key={i} className={styles.letter} data-letter>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
