import { Hero } from "@/components/sections/Hero";
import { ProjectStripSection } from "@/components/windows/ProjectStripSection";
import { Shelf } from "@/components/sections/Shelf";
import { Steps } from "@/components/sections/Steps";
import { Work } from "@/components/sections/Work";
import { WorkIntro } from "@/components/sections/WorkIntro";
import type { Lang } from "@/content/routes";

/** Homepage, rebuilt section by section from the 2026-09-30 concept: the hero film opens the page (no intro since 2026-10-05), then the shelf statement, the three steps, the projects intro and the projects deck (sky band parked). */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Hero lang={lang} />
      <ProjectStripSection lang={lang} />
      <Shelf lang={lang} />
      <Steps lang={lang} />
      <WorkIntro lang={lang} />
      <Work lang={lang} />
      {/* Sky band (components/sections/Sky) parked on 2026-10-01 until its layout is reworked */}
    </>
  );
}
