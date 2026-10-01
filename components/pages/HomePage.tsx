import { Preloader } from "@/components/motion/Preloader";
import { Hero } from "@/components/sections/Hero";
import { Shelf } from "@/components/sections/Shelf";
import { Steps } from "@/components/sections/Steps";
import type { Lang } from "@/content/routes";

/** Homepage, rebuilt section by section from the 2026-09-30 concept: intro (preloader), hero, shelf statement, the three steps so far (sky band parked). */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Preloader lang={lang} />
      <Hero lang={lang} />
      <Shelf lang={lang} />
      <Steps lang={lang} />
      {/* Sky band (components/sections/Sky) parked on 2026-10-01 until its layout is reworked */}
    </>
  );
}
