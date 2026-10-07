import { SupremeHero } from "@/components/supreme/SupremeHero";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";

/**
 * About (owner, 2026-10-07): the company's story as the procedural 3D model of one building becoming eight homes
 * (components/supreme, SCENE-3D.md), under the collaboration ring and into the letter band. This server part passes
 * the copy as plain strings: the five stage lines, each with the body of its chapter where one belongs, and the finale.
 */
export function AboutStory({ lang }: { lang: Lang }) {
  const s = getCopy(lang).aboutStory;
  const stages = s.stages.map((st) => ({ label: st.label, title: st.title, body: st.chapter === null ? null : (s.chapters[st.chapter]?.body ?? null) }));
  return <SupremeHero label={s.label} title={s.title} stages={stages} close={s.close} finale={s.finale} />;
}
