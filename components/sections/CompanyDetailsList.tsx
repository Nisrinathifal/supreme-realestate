import { company, formatAddressLines, has, hasAddress, postalDiffers, telHref } from "@/content/company";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";
import styles from "./CompanyDetailsList.module.css";

type Row = { key: string; value: React.ReactNode };

/**
 * Definition list of verified company details (DESIGN §9.7). Rows without a verified value are
 * omitted entirely. Key order follows the spec.
 */
export function CompanyDetailsList({ lang, showManagement = true, className }: { lang: Lang; showManagement?: boolean; className?: string }) {
  const c = getCopy(lang);
  const k = c.companyKeys;
  const rows: Row[] = [];
  if (has(company.legalName)) rows.push({ key: k.legalName, value: company.legalName });
  if (has(company.tradeName)) rows.push({ key: k.tradeName, value: company.tradeName });
  if (has(company.kvk)) rows.push({ key: k.kvk, value: company.kvk });
  if (hasAddress(company.visitingAddress)) {
    rows.push({
      key: k.visitingAddress,
      value: formatAddressLines(company.visitingAddress).map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      )),
    });
  }
  if (postalDiffers()) {
    rows.push({
      key: k.postalAddress,
      value: formatAddressLines(company.postalAddress).map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      )),
    });
  }
  if (has(company.vat)) rows.push({ key: k.vat, value: company.vat });
  if (has(company.email)) rows.push({ key: k.email, value: <a href={`mailto:${company.email}`}>{company.email}</a> });
  if (has(company.phone)) rows.push({ key: k.phone, value: <a href={telHref(company.phone)}>{company.phone}</a> });
  if (has(company.availability[lang])) rows.push({ key: k.availability, value: company.availability[lang] });
  if (showManagement && company.management.length > 0) {
    rows.push({
      key: k.management,
      value: company.management.map((p, i) => (
        <span key={i} className={styles.line}>
          {p.name}
          {has(p.role[lang]) ? `, ${p.role[lang]}` : ""}
        </span>
      )),
    });
  }
  if (has(company.linkedin)) {
    rows.push({
      key: k.linkedin,
      value: (
        <a href={company.linkedin} rel="noopener noreferrer" target="_blank">
          {company.linkedin.replace(/^https?:\/\//, "")}
        </a>
      ),
    });
  }
  if (rows.length === 0) return null;
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <dl className={styles.list}>
        {rows.map((r) => (
          <div key={r.key} className={styles.row}>
            <dt className="t-micro">{r.key}</dt>
            <dd className={`t-legal ${styles.value}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {has(company.emailLegal) ? (
        <p className={`t-legal ${styles.legalLine}`}>
          <strong>{c.companyLegalLine}:</strong> <a href={`mailto:${company.emailLegal}`}>{company.emailLegal}</a>
        </p>
      ) : null}
    </div>
  );
}
