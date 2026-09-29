import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { company, has, telHref } from "@/content/company";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./ContactCta.module.css";

/** Contact (DESIGN §10.1 §7): De lijn from the index label to the heading, H2, body, primary button, text links. */
export function ContactCta({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={`section ${styles.section}`} aria-labelledby="contact-title">
      <div className={`container ${styles.inner}`} data-rise>
        <MicroLabel data-rise-item>{c.contactSection.label}</MicroLabel>
        <span className={styles.lijn} aria-hidden="true" />
        <h2 id="contact-title" className="t-h2" data-blur-in>
          {c.contactSection.title}
        </h2>
        <p className="t-lead" data-rise-item>
          {c.contactSection.body}
        </p>
        <div className={styles.actions} data-rise-item>
          <Button href={pathFor("contact", lang)} variant="primary" arrow>
            {c.contactSection.cta}
          </Button>
          {has(company.email) ? (
            <Button href={`mailto:${company.email}`} variant="text">
              {company.email}
            </Button>
          ) : null}
          {has(company.phone) ? (
            <Button href={telHref(company.phone)} variant="text">
              {company.phone}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
