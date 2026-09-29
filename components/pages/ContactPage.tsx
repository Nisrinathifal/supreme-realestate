import { PageIntro } from "@/components/sections/PageIntro";
import { CompanyDetailsList } from "@/components/sections/CompanyDetailsList";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";

/** M1 shell. Contact methods and form (DESIGN §9.11) land in M3. */
export function ContactPage({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <>
      <PageIntro title={c.contactPage.title} lead={c.contactPage.lead} />
      <section className="section">
        <div className="container">
          <CompanyDetailsList lang={lang} showManagement={false} />
        </div>
      </section>
    </>
  );
}
