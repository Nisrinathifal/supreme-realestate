import { MicroLabel } from "@/components/ui/MicroLabel";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./Statement.module.css";

/** Statement (DESIGN §10.1 §2): words pre-split on the server; colour reveal on scroll (§11). */
export function Statement({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const words = c.statement.text.split(" ");
  return (
    <section className={`section section--daylight ${styles.section}`} aria-labelledby="statement-label">
      <div className="container">
        <MicroLabel id="statement-label" className={styles.label}>
          {c.statement.label}
        </MicroLabel>
        <p className={`t-statement ${styles.text}`} data-statement>
          {words.map((w, i) => (
            <span key={i}>
              <span className={styles.w} data-w>
                {w}
              </span>
              {i < words.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
