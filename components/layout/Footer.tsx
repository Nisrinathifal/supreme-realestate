import Link from "next/link";
import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { Wordmark } from "@/components/brand/Wordmark";
import { company, formatAddressLines, has, hasAddress, telHref } from "@/content/company";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./Footer.module.css";

/**
 * Footer after the reference (REFERENCE 5.7): light, giant wordmark, then a bar with lockup, contact,
 * legal line and legal links. On the homepage the wordmark is rendered by the Closing section
 * (it rises after the capsule expands), so the footer's own wordmark row hides there via :has().
 */
export function Footer({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const year = new Date().getFullYear();
  const legalParts = [
    company.legalName,
    has(company.kvk) ? `${c.footer.kvk} ${company.kvk}` : null,
    has(company.vat) ? `${c.footer.vat} ${company.vat}` : null,
    has(company.visitingAddress.city) ? company.visitingAddress.city : null,
  ].filter(Boolean);

  return (
    <footer className={styles.footer} data-footer>
      <div className={`container ${styles.inner}`}>
        <div className={styles.wordmarkRow} data-footer-wordmark>
          <Wordmark text={c.brand.wordmark} />
        </div>
        <div className={styles.bar} data-footer-bar>
          <div className={styles.row}>
            <Lockup ariaLabel={c.siteName} height={52} />
            <address className={`t-legal ${styles.contact}`}>
              {has(company.email) ? <a href={`mailto:${company.email}`}>{company.email}</a> : null}
              {has(company.phone) ? <a href={telHref(company.phone)}>{company.phone}</a> : null}
              {hasAddress(company.visitingAddress) ? (
                <span className={styles.address}>
                  {formatAddressLines(company.visitingAddress).map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </span>
              ) : null}
            </address>
          </div>
          <div className={styles.row}>
            <p className={`t-legal ${styles.legal}`}>
              <span>{legalParts.join(" · ")}</span>
              <span aria-hidden="true"> · </span>
              <span>{c.footer.copyright(year)}</span>
            </p>
            <nav aria-label={c.a11y.legalNav}>
              <ul className={styles.links}>
                {c.footer.links.map((l) => (
                  <li key={l.key}>
                    <Link href={pathFor(l.key, lang)} className={`t-legal ${styles.link}`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {has(company.linkedin) ? (
                  <li>
                    <a href={company.linkedin} rel="noopener noreferrer" target="_blank" className={styles.icon} aria-label={c.footer.linkedin}>
                      <LinkedinLogo size={20} weight="light" aria-hidden="true" />
                    </a>
                  </li>
                ) : null}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
