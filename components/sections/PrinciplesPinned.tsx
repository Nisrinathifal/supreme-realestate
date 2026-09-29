import { Compass, Hourglass, Stack } from "@phosphor-icons/react/dist/ssr";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { principlesTall, principlesThumb } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./PrinciplesPinned.module.css";

const icons = [Compass, Stack, Hourglass];

/**
 * Pinned dark section after the reference (REFERENCE 5.3, §9): P4 on enter, centred heading + subline,
 * a tall image anchored to the bottom that the "camera" travels up, three principle cards around it
 * (A on Lime mist, B and C glass to solid) and one small thumbnail. Tilt 0°, no avatar, no room pill.
 * Mobile and no-JS: image, then the cards stacked.
 */
export function PrinciplesPinned({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={`inverse ${styles.band}`} data-expand data-pinned-principles aria-labelledby="principes-title">
      <div className={styles.viewport} data-pin-viewport>
        <div className={`container ${styles.head}`} data-pin-head>
          <MicroLabel className={styles.label}>{c.principles.label}</MicroLabel>
          <h2 id="principes-title" className="t-h2">
            {c.principles.title}
          </h2>
          <p className={`t-lead ${styles.sub}`}>{c.principles.sub}</p>
        </div>
        <div className={`container ${styles.stage}`}>
          <div className={styles.tall} data-pin-photo>
            <MediaFrame image={principlesTall.image} ratio="4/5" lang={lang} radius="lg" decorative sizes="(max-width: 980px) 90vw, 38vw" />
          </div>
          <ol className={styles.cards}>
            {c.principles.items.map((p, i) => {
              const Icon = icons[i];
              return (
                <li key={p.index} className={`${styles.card} ${styles[`card${i + 1}`]}`} data-pin-card={i + 1}>
                  <div className={styles.cardTop}>
                    <span className={styles.tile} aria-hidden="true">
                      <Icon size={22} weight="light" />
                    </span>
                    <span className="t-micro">{p.index}</span>
                  </div>
                  <h3 className="t-h3">{p.title}</h3>
                  <p className={`t-body ${styles.body}`}>{p.body}</p>
                </li>
              );
            })}
          </ol>
          <div className={styles.thumb} data-pin-thumb aria-hidden="true">
            <MediaFrame image={principlesThumb.image} ratio="1/1" lang={lang} radius="lg" decorative sizes="120px" />
          </div>
        </div>
      </div>
    </section>
  );
}
