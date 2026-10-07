import { AboutStory } from "@/components/sections/AboutStory";
import { CompanyLetter } from "@/components/sections/CompanyLetter";
import { Hero } from "@/components/sections/Hero";
import { Shelf } from "@/components/sections/Shelf";
import { Steps } from "@/components/sections/Steps";
import { Work } from "@/components/sections/Work";
import { WorkIntro } from "@/components/sections/WorkIntro";
import type { Lang } from "@/content/routes";

/**
 * Homepage: the hero film opens the page (no intro since 2026-10-05), the projects deck follows it at once (owner,
 * 2026-10-05: the way in for anyone who never hovers the facades, and on phones), then the shelf statement, the three
 * steps and, back since 2026-10-07 (owner), the collaboration ring (WorkIntro: the cards and mascots turning around
 * "Built together with people we trust"), sliding up over the held steps strip as it was designed to, and under it (owner,
 * 2026-10-07) About: the company story beside a room that renews as it is read, then the company details as a letter
 * that comes out of an envelope (CompanyLetter). The sky band is parked.
 */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Hero lang={lang} />
      <Work lang={lang} />
      <Shelf lang={lang} />
      <Steps lang={lang} />
      <WorkIntro lang={lang} />
      <AboutStory lang={lang} />
      <CompanyLetter lang={lang} />
      {/* Sky band (components/sections/Sky) parked on 2026-10-01 until its layout is reworked */}
    </>
  );
}
