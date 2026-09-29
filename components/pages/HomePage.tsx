import { HomeMotion } from "@/components/motion/HomeMotion";
import { Bedrijfsgegevens } from "@/components/sections/Bedrijfsgegevens";
import { ContactCta } from "@/components/sections/ContactCta";
import { Details } from "@/components/sections/Details";
import { Hero } from "@/components/sections/Hero";
import { Impressies } from "@/components/sections/Impressies";
import { Principes } from "@/components/sections/Principes";
import { Statement } from "@/components/sections/Statement";
import type { Lang } from "@/content/routes";

/** Homepage in DESIGN §10.1 order. Footer comes from the layout. */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <HomeMotion>
      <Hero lang={lang} />
      <Statement lang={lang} />
      <Principes lang={lang} />
      <Details lang={lang} />
      <Impressies lang={lang} />
      <Bedrijfsgegevens lang={lang} />
      <ContactCta lang={lang} />
    </HomeMotion>
  );
}
