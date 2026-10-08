import { PageIntro } from "@/components/sections/PageIntro";
import { CompanyDetailsList } from "@/components/sections/CompanyDetailsList";
import { ContactForm } from "@/components/sections/ContactForm";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./ContactPage.module.css";

/** Contact (DESIGN §10, §9.11; owner, 2026-10-08: the form first, the company details under it). */
export function ContactPage({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <>
      <PageIntro title={c.contactPage.title} lead={c.contactPage.lead} />
      <section className="section" aria-labelledby="contact-form">
        <div className={`container ${styles.block}`}>
          <h2 id="contact-form" className={`t-h3 ${styles.title}`}>
            {c.contactPage.formTitle}
          </h2>
          <ContactForm lang={lang} />
        </div>
      </section>
      <section className="section" aria-labelledby="contact-methods">
        <div className={`container ${styles.block}`}>
          <h2 id="contact-methods" className={`t-h3 ${styles.title}`}>
            {c.contactPage.methodsTitle}
          </h2>
          <CompanyDetailsList lang={lang} showManagement={false} />
        </div>
      </section>
    </>
  );
}
