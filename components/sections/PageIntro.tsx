import { MicroLabel } from "@/components/ui/MicroLabel";
import styles from "./PageIntro.module.css";

/** Standard page opening: optional index label, H1, optional lead. */
export function PageIntro({ label, title, lead, children }: { label?: string; title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <section className={`section ${styles.intro}`}>
      <div className="container">
        {label ? <MicroLabel className={styles.label}>{label}</MicroLabel> : null}
        <h1 className={`t-h2 ${styles.title}`}>{title}</h1>
        {lead ? <p className={`t-lead ${styles.lead}`}>{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
