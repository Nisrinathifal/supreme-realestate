import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { RoofMark } from "@/components/brand/RoofMark";
import { AlphaImage } from "@/components/ui/AlphaImage";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { Placeholder } from "@/components/ui/Placeholder";
import { company, has } from "@/content/company";
import { getCopy } from "@/content/copy";
import { shelfIcons } from "@/content/media";
import type { Lang } from "@/content/routes";
import { CompanyDetailsList } from "./CompanyDetailsList";
import { CompanyLetterMotion } from "./CompanyLetterMotion";
import styles from "./CompanyLetter.module.css";

/** The four shelf icons around the envelope, each in its corner (after the reference's floating objects). */
const icons = [
  { key: "bulb", cls: "iconA" },
  { key: "clipboard", cls: "iconB" },
  { key: "hammer", cls: "iconC" },
  { key: "chart", cls: "iconD" },
] as const;

/**
 * Company details as a letter (owner, 2026-10-07, after the "open letter" band of illoca.unseen.co): on the page's
 * dark ground, the title at the top, the brand's four 3D icons around, and an envelope at the foot of the view. As the
 * page scrolls (CompanyLetterMotion, pinned) the letter rises out of the envelope over the title and the envelope
 * drops away; a long letter then reads on upwards. The letter is the proof: Supreme's letterhead, "to whom it may
 * concern", the registration line, the verified company details (company.json, empty rows hidden; a development
 * placeholder names what the KvK extract must supply), the link to the KvK register and a sign-off
 * with the roof-S mark (the site logo's) as seal. Reduced motion and no-JS: the title and the letter, no envelope.
 */
export function CompanyLetter({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const r = c.register;

  return (
    <section id="company" className={`inverse ${styles.band}`} data-letter data-tone="dark" data-tone-fill data-tone-lead="0.4" data-header-theme="dark" aria-labelledby="company-title">
      <CompanyLetterMotion>
        <div className={styles.stage} data-letter-stage>
          <div className={styles.icons} aria-hidden="true">
            {icons.map((i) => (
              <span key={i.key} className={`${styles.icon} ${styles[i.cls]}`} data-letter-icon>
                <AlphaImage image={shelfIcons[i.key]} lang={lang} size={160} decorative />
              </span>
            ))}
          </div>

          <header className={styles.head} data-letter-head>
            <MicroLabel className={styles.label}>{r.label}</MicroLabel>
            <h2 id="company-title" className={styles.title}>
              {c.companySection.title}
            </h2>
          </header>

          <div className={styles.packet} data-letter-packet>
          <div className={styles.envelope} data-letter-envelope aria-hidden="true">
            <span className={styles.flap} />
            <span className={styles.back} />
          </div>

          <article className={`light ${styles.letter}`} data-letter-paper>
            <header className={styles.letterhead}>
              <Lockup ariaLabel={c.siteName} height={26} />
              <span className="t-micro">{c.companySection.title}</span>
            </header>
            <p className={styles.salutation}>{r.salutation}</p>
            <p className={styles.lead}>{r.lead}</p>
            <CompanyDetailsList lang={lang} className={styles.details} />
            {has(company.kvk) ? (
              <a className={styles.verify} href={`https://www.kvk.nl/zoeken/?source=all&q=${encodeURIComponent(company.kvk)}`} target="_blank" rel="noopener noreferrer">
                {r.verify}
                <ArrowUpRight size={16} weight="light" aria-hidden="true" />
              </a>
            ) : (
              <Placeholder note={r.pending} className={styles.pending} />
            )}
            <footer className={styles.sign}>
              <span className={styles.seal} aria-hidden="true">
                <RoofMark size={26} decorative />
              </span>
              <span>
                {r.signoff}
                <br />
                <strong>{company.legalName}</strong>
              </span>
            </footer>
          </article>

          <div className={styles.pocket} data-letter-pocket aria-hidden="true">
            <span className={styles.fold} />
            <span className={styles.pocketSeal}>
              <RoofMark size={32} decorative />
            </span>
          </div>
          </div>
        </div>
      </CompanyLetterMotion>
    </section>
  );
}
