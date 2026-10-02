import { MicroLabel } from "@/components/ui/MicroLabel";
import { workCases } from "@/content/media";
import { getCopy } from "@/content/copy";
import { workPathFor, type Lang } from "@/content/routes";
import { WorkDeck } from "./WorkDeck";
import styles from "./Work.module.css";

/**
 * Work section (2026-10-02): an intro, then the deck of case cards (WorkDeck): stacked title strips over the finished
 * photographs; a card opens to show its before/after comparison and the link to the case. Cases are anonymous
 * (PRD §6); copy is draft until the owner replaces it.
 */
export function Work({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const total = String(c.work.items.length).padStart(2, "0");
  const items = c.work.items.flatMap((item, i) => {
    const media = workCases[i];
    return media ? [{ index: item.index, title: item.title, href: workPathFor(i, lang), after: media.cover, before: media.before }] : [];
  });
  return (
    <section id="work" className={styles.work} data-work aria-labelledby="work-title">
      <div className={`container ${styles.intro}`}>
        <MicroLabel>{c.work.label}</MicroLabel>
        <h2 id="work-title" className={styles.title}>
          {c.work.title}
        </h2>
        <p className={styles.lead}>{c.work.lead}</p>
      </div>
      <WorkDeck items={items} lang={lang} labels={{ of: c.work.of, total, open: c.work.open, close: c.work.close, compare: c.work.compare }} />
    </section>
  );
}
