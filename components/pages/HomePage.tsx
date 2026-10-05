import { Hero } from "@/components/sections/Hero";
import { Shelf } from "@/components/sections/Shelf";
import { Steps } from "@/components/sections/Steps";
import { Work } from "@/components/sections/Work";
import type { Lang } from "@/content/routes";

/** Homepage: the hero film opens the page (no intro since 2026-10-05), the projects deck follows it at once (owner, 2026-10-05: the way in for anyone who never hovers the facades, and on phones), then the shelf statement and the three steps. The projects orbit intro (WorkIntro) and the sky band are parked. */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Hero lang={lang} />
      <Work lang={lang} />
      <Shelf lang={lang} />
      <Steps lang={lang} />
      {/* Projects orbit intro (components/sections/WorkIntro) parked on 2026-10-05: the deck now follows the hero directly.
          Sky band (components/sections/Sky) parked on 2026-10-01 until its layout is reworked */}
    </>
  );
}
