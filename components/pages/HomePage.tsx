import { PageIntro } from "@/components/sections/PageIntro";
import { CompanyDetailsList } from "@/components/sections/CompanyDetailsList";
import { Placeholder } from "@/components/ui/Placeholder";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";

/** M1 shell. Full sections (DESIGN §10.1) land in M2. */
export function HomePage({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <>
      <PageIntro title={c.hero.display} lead={c.hero.lead}>
        <Placeholder note={c.placeholders.film} />
      </PageIntro>
      <section className="section" id="bedrijf">
        <div className="container stack">
          <h2 className="t-h3">{c.companySection.title}</h2>
          <CompanyDetailsList lang={lang} />
        </div>
      </section>
    </>
  );
}
