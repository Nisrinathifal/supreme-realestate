import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { company, has, telHref } from "@/content/company";
import { closingCapsule, wordmarkCapsule } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./Closing.module.css";

/**
 * Closing after the reference (REFERENCE 5.6 + 5.7): two columns (large headline left, short text and
 * dark CTA right), a marquee of the tagline with a capsule image fixed at its centre, then the capsule
 * grows into the wide image (pinned, scrubbed), the giant wordmark rises letter by letter with a small
 * capsule at its end. The footer bar follows from the layout.
 */
export function Closing({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const marqueeItems = Array.from({ length: 8 });
  return (
    <section className={`section ${styles.section}`} data-closing aria-labelledby="closing-title">
      <div className={`container ${styles.top}`}>
        <div className={styles.left} data-fade-up>
          <MicroLabel>{c.contactSection.label}</MicroLabel>
          <h2 id="closing-title" className={`t-h2 ${styles.title}`}>
            {c.closing.title}
          </h2>
        </div>
        <div className={styles.right} data-fade-up>
          <p className="t-lead">{c.closing.body}</p>
          <div className={styles.actions}>
            <Button href={pathFor("contact", lang)} variant="primary" arrow>
              {c.closing.cta}
            </Button>
            {has(company.email) ? (
              <Button href={`mailto:${company.email}`} variant="text">
                {company.email}
              </Button>
            ) : null}
            {has(company.phone) ? (
              <Button href={telHref(company.phone)} variant="text">
                {company.phone}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.pinBlock} data-capsule-block>
        <div className={styles.marquee} aria-hidden="true" data-marquee>
          <div className={styles.track} data-marquee-track>
            {marqueeItems.map((_, i) => (
              <span key={i} className={styles.marqueeItem}>
                {c.closing.marquee}
                <span className={styles.marqueeDot} />
              </span>
            ))}
          </div>
          <div className={styles.capsule} data-capsule-hero>
            <MediaFrame image={closingCapsule.image} ratio="fill" lang={lang} radius="none" decorative sizes="100vw" />
          </div>
        </div>
        <div className={`container ${styles.wide}`} data-capsule-target aria-hidden="true" />
      </div>

      <div className={`container ${styles.wordmarkRow}`}>
        <div className={styles.wordmark} data-closing-wordmark>
          <Wordmark text={c.brand.wordmark} />
        </div>
        <div className={styles.endCapsule} data-end-capsule aria-hidden="true">
          <MediaFrame image={wordmarkCapsule.image} ratio="16/9" lang={lang} radius="pill" decorative sizes="200px" />
        </div>
      </div>
    </section>
  );
}
