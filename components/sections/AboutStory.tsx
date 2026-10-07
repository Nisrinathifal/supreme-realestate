import { ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import { company, has, hasAddress } from "@/content/company";
import { getCopy } from "@/content/copy";
import { projects } from "@/content/projects";
import { pathFor, type Lang, type PageKey } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { Placeholder } from "@/components/ui/Placeholder";
import { CompanyDetailsList } from "./CompanyDetailsList";
import { AboutStoryMotion } from "./AboutStoryMotion";
import styles from "./AboutStory.module.css";

/**
 * About + company details (owner, 2026-10-07), under the collaboration ring. "From old to valuable", told literally:
 * the company story in five chapters beside one photograph of a featured project's kitchen that renews from the
 * works to the finished room as the chapters are read (AboutStoryMotion). The story ends in the proof: the company
 * details, laid out like a register extract, with a link to check them in the KvK register. Every row shows only
 * a verified value (company.json); until the extract arrives a development placeholder says what is missing.
 * Reduced motion and no-JS: the finished room, every chapter in full, the register in place.
 */
export function AboutStory({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const s = c.aboutStory;
  const r = c.register;
  const pair = projects.find((p) => p.compare.length > 0)?.compare[0];
  const docs = c.footer.links.map((l) => ({ ...l, href: pathFor(l.key as PageKey, lang) }));
  const proofs = [
    has(company.kvk) ? r.proofKvk : null,
    hasAddress(company.visitingAddress) ? r.proofOffice(company.visitingAddress.city) : null,
    r.proofTeam,
  ].filter((p): p is string => Boolean(p));

  return (
    <section id="about" className={styles.about} data-about-story aria-labelledby="about-title">
      <AboutStoryMotion>
        <div className={`container ${styles.inner}`}>
          <header className={styles.head}>
            <MicroLabel className={styles.label}>{s.label}</MicroLabel>
            <h2 id="about-title" className={styles.title}>
              {s.title.split(" ").map((word, i) => (
                <span key={i} className={styles.mask}>
                  <span data-story-word>{word}</span>
                </span>
              ))}
            </h2>
          </header>

          <div className={styles.story}>
            <div className={styles.aside}>
              <div className={styles.sticky}>
                {pair ? (
                  <figure className={styles.frame} data-story-frame>
                    <div className={styles.layer}>
                      <MediaFrame image={pair.before} ratio="fill" lang={lang} radius="none" sizes="(max-width: 980px) 100vw, 42vw" />
                    </div>
                    <div className={`${styles.layer} ${styles.after}`}>
                      <MediaFrame image={pair.after} ratio="fill" lang={lang} radius="none" sizes="(max-width: 980px) 100vw, 42vw" />
                    </div>
                    <span className={styles.seam} aria-hidden="true" />
                    <figcaption className={styles.tags} aria-hidden="true">
                      <span className={styles.tagBefore}>{s.frame.before}</span>
                      <span className={styles.tagAfter}>{s.frame.after}</span>
                    </figcaption>
                  </figure>
                ) : null}
                <ol className={styles.rail} aria-hidden="true">
                  {s.chapters.map((ch, i) => (
                    <li key={i} className={styles.stop} data-story-stop={i}>
                      {ch.name}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={styles.chapters}>
              {s.chapters.map((ch, i) => (
                <article key={i} className={styles.chapter} data-story-chapter={i}>
                  <h3 className={styles.chapterName}>{ch.name}</h3>
                  <p className={styles.chapterBody}>{ch.body}</p>
                </article>
              ))}
              <p className={styles.close}>{s.close}</p>
            </div>
          </div>

          <div className={styles.register} id="company">
            <div className={styles.registerText}>
              <MicroLabel className={styles.label}>{r.label}</MicroLabel>
              <h3 className={styles.registerTitle}>{c.companySection.title}</h3>
              <p className={styles.registerLead}>{r.lead}</p>
              <ul className={styles.proofs}>
                {proofs.map((p) => (
                  <li key={p} className={styles.proof}>
                    <Check size={18} weight="light" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.card} data-register-card>
              <div className={styles.cardHead}>
                <span className="t-micro">{r.extract}</span>
                <span className={styles.cardName}>{company.legalName}</span>
              </div>
              <CompanyDetailsList lang={lang} className={styles.cardList} />
              {has(company.kvk) ? (
                <a className={styles.verify} href={`https://www.kvk.nl/zoeken/?source=all&q=${encodeURIComponent(company.kvk)}`} target="_blank" rel="noopener noreferrer">
                  {r.verify}
                  <ArrowUpRight size={16} weight="light" aria-hidden="true" />
                </a>
              ) : (
                <Placeholder note={r.pending} className={styles.pending} />
              )}
              <div className={styles.docs}>
                <span className="t-micro">{r.documents}</span>
                <ul className={styles.docList}>
                  {docs.map((d) => (
                    <li key={d.key}>
                      <a href={d.href}>{d.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AboutStoryMotion>
    </section>
  );
}
