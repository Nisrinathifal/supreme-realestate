import { HomeMotion } from "@/components/motion/HomeMotion";
import { Bedrijfsgegevens } from "@/components/sections/Bedrijfsgegevens";
import { Carousel } from "@/components/sections/Carousel";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { MapBand } from "@/components/sections/MapBand";
import { PrinciplesPinned } from "@/components/sections/PrinciplesPinned";
import { Statement } from "@/components/sections/Statement";
import type { Lang } from "@/content/routes";

/** Homepage after the reference recording (REFERENCE §5 order) with Supreme content and PRD §6 disclosure. */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <HomeMotion>
      <Hero lang={lang} />
      <Statement lang={lang} />
      <PrinciplesPinned lang={lang} />
      <Carousel lang={lang} />
      <MapBand lang={lang} />
      <Bedrijfsgegevens lang={lang} />
      <Closing lang={lang} />
    </HomeMotion>
  );
}
