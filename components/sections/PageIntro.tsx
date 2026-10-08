import { MicroLabel } from "@/components/ui/MicroLabel";
import styles from "./PageIntro.module.css";

/** Standard page opening: optional index label, H1, optional lead. */
export function PageIntro({ label, title, lead, children, align = "start" }: { label?: string; title: string; lead?: string; children?: React.ReactNode; /** `center`: title and lead centred, for a page that is one centred column (contact). */ align?: "start" | "center" }) {
  return (
    <section className={`section ${styles.intro}${align === "center" ? ` ${styles.center}` : ""}`}>
      <div className="container">
        {label ? <MicroLabel className={styles.label}>{label}</MicroLabel> : null}
        <h1 className={`t-h2 ${styles.title}`}>{title}</h1>
        {lead ? <p className={`t-lead ${styles.lead}`}>{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
