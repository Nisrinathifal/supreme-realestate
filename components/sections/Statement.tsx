import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { statementCapsules } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./Statement.module.css";

/**
 * Statement after the reference (REFERENCE 5.2): large paragraph in a ~70% column with the word reveal,
 * below it two capsule images and a short text column on the right. No chips.
 */
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
        <div className={styles.row}>
          <div className={styles.capsules}>
            {statementCapsules.map((slot) => (
              <div key={slot.id} className={styles.capsule} data-capsule>
                <MediaFrame image={slot.image} ratio="16/9" lang={lang} radius="pill" decorative sizes="(max-width: 980px) 45vw, 22vw" />
              </div>
            ))}
          </div>
          <p className={`t-body ${styles.aside}`} data-fade-up>
            {c.statement.aside}
          </p>
        </div>
      </div>
    </section>
  );
}
