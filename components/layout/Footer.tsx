import Link from "next/link";
import { Lockup } from "@/components/brand/Lockup";
import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { company, has, telHref } from "@/content/company";
import { footerSketches } from "@/content/media";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./Footer.module.css";

/** Contact band at the end of every page (DESIGN §10.1 Contact): label, H2, one sentence, the primary button. */
export function ContactBand({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  return (
    <section className={styles.band} data-contact-band aria-labelledby="contact-band-title">
      <div className={`container ${styles.bandInner}`}>
        <MicroLabel>{c.footer.cta.label}</MicroLabel>
        <h2 id="contact-band-title" className={styles.bandTitle}>
          {c.footer.cta.title}
        </h2>
        <p className={styles.bandBody}>{c.footer.cta.body}</p>
        <Button href={pathFor("contact", lang)} variant="primary" arrow>
          {c.footer.cta.button}
        </Button>
      </div>
    </section>
  );
}

/**
 * Footer after the reference: revealed from under the page (sticky). Top row: section links · lockup with the
 * legal line · social links (placeholders until verified). Bottom row: phone · back to top · legal pages. Two ink line
 * drawings sit along the bottom edge. Company values come from company.json and hide while unverified;
 * the phone shows the fictional stand-in from the copy until then (no tel: link).
 */
export function Footer({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const year = new Date().getFullYear();
  const home = pathFor("home", lang);
  const phone = has(company.phone) ? company.phone : c.placeholders.phone;
  const phoneHref = has(company.phone) ? telHref(company.phone) : "";
  const legalParts = [company.legalName, has(company.kvk) ? `${c.footer.kvk} ${company.kvk}` : null].filter(Boolean);

  return (
    <footer className={styles.footer} data-footer>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <nav aria-label={c.a11y.footerNav}>
            <ul className={styles.list}>
              {c.nav.sections.map((s) => (
                <li key={s.id}>
                  <a href={`${home === "/" ? "" : home}/#${s.id}`} className={styles.link}>
                    {s.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href={pathFor("contact", lang)} className={styles.link}>
                  {c.nav.contact}
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.brand}>
            <Lockup ariaLabel={c.siteName} height={40} />
            <p className={`t-legal ${styles.legal}`}>
              {c.footer.copyright(year)} {legalParts.join(" · ")}
            </p>
          </div>

          {/* Social links: the verified LinkedIn from company.json, otherwise the placeholder list from the copy */}
          <ul className={styles.aside}>
            {has(company.linkedin) ? (
              <li>
                <a href={company.linkedin} rel="noopener noreferrer" target="_blank" className={styles.link}>
                  {c.footer.linkedin}
                </a>
              </li>
            ) : (
              c.placeholders.social.map((name) => (
                <li key={name}>
                  <a href="#" className={styles.link} aria-disabled="true" onClick={undefined}>
                    {name}
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className={styles.bottom}>
          <p className={`t-legal ${styles.call}`}>
            <span className={styles.muted}>{c.footer.callUs}</span>{" "}
            {phoneHref ? <a href={phoneHref}>{phone}</a> : <span>{phone}</span>}
          </p>
          <a href="#main" className={`t-micro ${styles.toTop}`}>
            {c.footer.backToTop}
          </a>
          <nav aria-label={c.a11y.legalNav}>
            <ul className={styles.legalLinks}>
              {c.footer.links.map((l) => (
                <li key={l.key}>
                  <Link href={pathFor(l.key, lang)} className={`t-legal ${styles.legalLink}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className={styles.sketches} aria-hidden="true">
        <div className={styles.sketchLeft}>
          <MediaFrame image={footerSketches.left} ratio="1/1" lang={lang} radius="none" decorative sizes="420px" />
        </div>
        <div className={styles.sketchRight}>
          <MediaFrame image={footerSketches.right} ratio="1/1" lang={lang} radius="none" decorative sizes="460px" />
        </div>
      </div>
    </footer>
  );
}
