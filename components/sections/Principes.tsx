import { Compass, Hourglass, Stack } from "@phosphor-icons/react/dist/ssr";
import { HairlineGrid } from "@/components/brand/HairlineGrid";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { principlesMedia } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./Principes.module.css";

const icons = [Compass, Stack, Hourglass];

/**
 * Principes (DESIGN §10.1 §3): inverse framed band, 21:9 media with three glass panels on the grid over
 * its lower half; on ≤980px media first, then the principles stacked (§9.5).
 */
export function Principes({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={`inverse ${styles.band}`} data-expand aria-labelledby="principes-title">
      <HairlineGrid />
      <div className={`container ${styles.inner}`}>
        <div className={styles.head} data-rise>
          <MicroLabel data-rise-item>{c.principles.label}</MicroLabel>
          <h2 id="principes-title" className="t-h2" data-blur-in>
            {c.principles.title}
          </h2>
        </div>
        <div className={styles.stage}>
          <MediaFrame image={principlesMedia.image} ratio="21/9" lang={lang} radius="lg" className={styles.media} decorative />
          <ol className={styles.panels} data-rise>
            {c.principles.items.map((p, i) => {
              const Icon = icons[i];
              return (
                <li key={p.index} className={styles.panel} data-rise-item>
                  <div className={styles.panelTop}>
                    <span className={styles.tile} aria-hidden="true">
                      <Icon size={24} weight="light" />
                    </span>
                    <span className="t-micro">{p.index}</span>
                  </div>
                  <h3 className="t-h3">{p.title}</h3>
                  <p className={`t-body ${styles.body}`}>{p.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
