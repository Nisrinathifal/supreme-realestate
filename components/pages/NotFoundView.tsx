import { RoofFrame } from "@/components/brand/RoofFrame";
import { Button } from "@/components/ui/Button";
import { getCopy } from "@/content/copy";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./NotFoundView.module.css";

/** 404 (DESIGN §10.2): Paper page, roof frame as an empty outline, H1, text link home. */
export function NotFoundView({ lang, headingLevel = "h1" }: { lang: Lang; headingLevel?: "h1" | "h2" }) {
  const c = getCopy(lang);
  const H = headingLevel;
  return (
    <section className={`section ${styles.wrap}`} lang={lang === "nl" ? "nl-NL" : "en"}>
      <div className={`container ${styles.grid}`}>
        <RoofFrame outline className={styles.roof} />
        <div className={styles.text}>
          <H className="t-h2">{c.notFound.title}</H>
          <Button href={pathFor("home", lang)} variant="text" arrow>
            {c.notFound.home}
          </Button>
        </div>
      </div>
    </section>
  );
}
