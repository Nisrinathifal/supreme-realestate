import { PageIntro } from "@/components/sections/PageIntro";
import { CompanyDetailsList } from "@/components/sections/CompanyDetailsList";
import { Placeholder } from "@/components/ui/Placeholder";
import { company, has } from "@/content/company";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";

/** M1 shell. Full layout (DESIGN §10.2) lands in M3. */
export function AboutPage({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <>
      <PageIntro title={c.about.title}>
        {has(company.story[lang]) ? <p className="t-body">{company.story[lang]}</p> : <Placeholder note={c.placeholders.story} />}
      </PageIntro>
      <section className="section">
        <div className="container stack">
          <h2 className="t-h3">{c.companySection.title}</h2>
          <CompanyDetailsList lang={lang} />
        </div>
      </section>
    </>
  );
}
