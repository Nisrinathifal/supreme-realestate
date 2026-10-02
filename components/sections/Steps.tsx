import { stepsClips, stepsSketches } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { StepClip } from "./StepClip";
import { StepsMotion } from "./StepsMotion";
import styles from "./Steps.module.css";

/**
 * Steps (concept 2026-10-01, after the reference "in years" band): an inverse band with a label and a
 * three-line headline between two line drawings; then a strip of three full-height panels (01 Reimagine,
 * 02 Divide, 03 Deliver). On desktop the band is pinned: the strip appears small at the bottom right, grows
 * to the viewport and slides sideways with the scroll (StepsMotion). Phones, reduced motion and no-JS read it
 * top to bottom: headline, then the three panels stacked.
 */
export function Steps({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="approach" className={`inverse ${styles.steps}`} data-steps data-header-theme="dark" aria-labelledby="steps-title">
      <StepsMotion>
        <div className={styles.stage} data-steps-stage>
          <div className={styles.sketch} data-steps-sketch="left" aria-hidden="true">
            <MediaFrame image={stepsSketches.left.image} ratio="1/1" lang={lang} radius="none" decorative sizes="340px" />
          </div>
          <div className={styles.head}>
            <MicroLabel>{c.steps.label}</MicroLabel>
            <h2 id="steps-title" className={styles.title}>
              {c.steps.lines.map((line, i) => (
                <span key={i} className={styles.line}>
                  <span className={styles.lineInner} data-steps-line>
                    {line}
                  </span>
                </span>
              ))}
            </h2>
          </div>
          <div className={styles.sketch} data-steps-sketch="right" aria-hidden="true">
            <MediaFrame image={stepsSketches.right.image} ratio="1/1" lang={lang} radius="none" decorative sizes="340px" />
          </div>
        </div>

        <ol className={styles.strip} data-steps-strip>
          {c.steps.items.map((item, i) => (
            <li key={item.index} className={i === 1 ? styles.panel : `${styles.panel} light`} data-steps-panel>
              <div className={styles.panelHead}>
                <MicroLabel>{item.index}</MicroLabel>
                <h3 className={styles.panelTitle}>{item.title}</h3>
              </div>
              <div className={styles.panelMedia}>
                {stepsClips[i] ? <StepClip clip={stepsClips[i]} lang={lang} /> : null}
              </div>
              <p className={styles.panelBody}>{item.body}</p>
            </li>
          ))}
        </ol>
      </StepsMotion>
    </section>
  );
}
