import { Gevelritme } from "@/components/brand/Gevelritme";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { Placeholder } from "@/components/ui/Placeholder";
import { company, has } from "@/content/company";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import { CompanyDetailsList } from "./CompanyDetailsList";
import styles from "./Bedrijfsgegevens.module.css";

/** Bedrijfsgegevens (DESIGN §10.1 §6): the proof section. Verified description left, details list right. */
export function Bedrijfsgegevens({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section id="bedrijf" className={`section section--daylight ${styles.section}`} aria-labelledby="bedrijf-title">
      <div className="container">
        <div className={styles.divider}>
          <Gevelritme />
        </div>
        <div className={styles.grid}>
          <div className={styles.left} data-rise>
            <MicroLabel data-rise-item>{c.companySection.label}</MicroLabel>
            <h2 id="bedrijf-title" className="t-h2" data-blur-in>
              {c.companySection.title}
            </h2>
            {has(company.description[lang]) ? (
              <p className="t-lead" data-rise-item>
                {company.description[lang]}
              </p>
            ) : (
              <Placeholder note={c.placeholders.description} />
            )}
          </div>
          <div className={styles.right} data-rise data-rise-item>
            <CompanyDetailsList lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
