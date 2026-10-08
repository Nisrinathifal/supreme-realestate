import { PageIntro } from "@/components/sections/PageIntro";
import { CompanyDetailsList } from "@/components/sections/CompanyDetailsList";
import { ContactForm } from "@/components/sections/ContactForm";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./ContactPage.module.css";

/**
 * Contact (DESIGN §10, §9.11; owner, 2026-10-08): one centred column. The opening, then the form in its own box
 * (no heading: the opening says what the page is for), then the ways to reach the company under it. The column is
 * as wide as a comfortable form, 640px; the "get in touch" band is left off this page (NotOnContact).
 */
export function ContactPage({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <>
      <PageIntro title={c.contactPage.title} lead={c.contactPage.lead} align="center" />
      <section className={`section ${styles.section}`} aria-label={c.contactPage.formTitle}>
        <div className={`container ${styles.column}`}>
          <div className={styles.box}>
            <ContactForm lang={lang} />
          </div>
        </div>
      </section>
      <section className={`section ${styles.section}`} aria-labelledby="contact-methods">
        <div className={`container ${styles.column}`}>
          <h2 id="contact-methods" className={`t-h3 ${styles.title}`}>
            {c.contactPage.methodsTitle}
          </h2>
          <CompanyDetailsList lang={lang} showManagement={false} />
        </div>
      </section>
    </>
  );
}
