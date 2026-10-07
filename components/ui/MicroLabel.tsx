import type { ReactNode } from "react";
import styles from "./MicroLabel.module.css";

/** The HTML tags a label renders as (a closed set: three/R3F widen JSX's ElementType to every 3D element). */
type Tag = "p" | "span" | "div" | "dt" | "li" | "h2" | "h3" | "h4";

/** Index labels, legal keys, film caption (DESIGN §9.2). Text only. */
export function MicroLabel({ as: Tag = "p", children, className, ...rest }: { as?: Tag; children: ReactNode; className?: string; id?: string; [key: `data-${string}`]: string | undefined }) {
  return (
    <Tag className={["t-micro", styles.label, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}
