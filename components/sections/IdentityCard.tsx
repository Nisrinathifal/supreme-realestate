import type { CSSProperties } from "react";
import { Lockup } from "@/components/brand/Lockup";
import { Mark } from "@/components/brand/Mark";
import { RoofFrame } from "@/components/brand/RoofFrame";
import { AlphaImage } from "@/components/ui/AlphaImage";
import { company, has, hasAddress } from "@/content/company";
import { getCopy } from "@/content/copy";
import { stepsSketches } from "@/content/media";
import type { Lang } from "@/content/routes";
import { IdentityTilt } from "./IdentityTilt";
import styles from "./IdentityCard.module.css";

/** A machine-readable line as on an ID card: capitals, digits and filler chevrons, 30 characters. */
const mrz = (s: string) =>
  s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[^A-Z0-9]+/g, "<")
    .padEnd(30, "<")
    .slice(0, 30);

const depth = (z: number) => ({ "--z": `${z}px` }) as CSSProperties;

/**
 * The company's identity card (owner, 2026-10-07): the register extract as a card in the ID-1 format, on Canal ink.
 * The lockup and the issuer up top, a canal-house drawing in the roof frame as its portrait, the fields that are
 * verified (company.json; the legal form and the activity follow from the legal name and the brief), the lime chip,
 * the brand's columns as security print, and a machine-readable zone. Its layers stand at different depths, so the
 * card reads as an object when IdentityTilt turns it under the pointer (fine pointers, motion on); a holographic sheen
 * follows the pointer. Without that it is a flat card. Decoration is hidden from assistive tech; the fields are a list.
 */
export function IdentityCard({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const r = c.register;
  const k = r.card;
  const fields: { label: string; value: string; wide?: boolean }[] = [{ label: k.name, value: company.legalName, wide: true }];
  if (/\bB\.?V\.?$/i.test(company.legalName)) fields.push({ label: k.form, value: k.formValue });
  fields.push({ label: k.activity, value: k.activityValue });
  if (has(company.kvk)) fields.push({ label: k.kvk, value: company.kvk });
  if (has(company.vat)) fields.push({ label: k.vat, value: company.vat });
  if (hasAddress(company.visitingAddress)) fields.push({ label: k.office, value: `${company.visitingAddress.city}, ${k.country}` });
  const portrait = stepsSketches.left.image;

  return (
    <IdentityTilt className={styles.stage}>
      <span className={styles.shadow} data-id-shadow aria-hidden="true" />
      <div className={styles.card} data-id-card role="group" aria-label={k.label}>
        <span className={styles.ground} aria-hidden="true">
          <span className={styles.print} />
          <span className={styles.watermark}>
            <Mark size={200} decorative />
          </span>
        </span>

        <div className={styles.head} style={depth(26)}>
          <Lockup ariaLabel={c.siteName} tone="light" height={22} className={styles.lockup} />
          <span className={styles.issuer}>
            <span>{r.extract}</span>
            <span className={styles.issuerCountry}>{k.country}</span>
          </span>
        </div>

        <div className={styles.body}>
          {portrait ? (
            <div className={styles.portrait} style={depth(44)} aria-hidden="true">
              <RoofFrame className={styles.roof}>
                <AlphaImage image={portrait} lang={lang} size={240} className={styles.sketch} decorative />
              </RoofFrame>
            </div>
          ) : null}
          <dl className={styles.fields} style={depth(18)}>
            {fields.map((f) => (
              <div key={f.label} className={f.wide ? `${styles.field} ${styles.wide}` : styles.field}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <span className={styles.chip} style={depth(34)} aria-hidden="true" />
        </div>

        <div className={styles.mrz} style={depth(10)} aria-hidden="true">
          <span>{mrz(`IDNLD ${company.kvk}`)}</span>
          <span>{mrz(company.legalName.replace(/\s+/g, " "))}</span>
        </div>

        <span className={styles.sheen} data-id-sheen aria-hidden="true" />
      </div>
    </IdentityTilt>
  );
}
