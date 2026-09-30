import { Preloader } from "@/components/motion/Preloader";
import { Hero } from "@/components/sections/Hero";
import type { Lang } from "@/content/routes";

/** Homepage, rebuilt section by section from the 2026-09-30 concept: intro (preloader) and hero so far. */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Preloader lang={lang} />
      <Hero lang={lang} />
    </>
  );
}
