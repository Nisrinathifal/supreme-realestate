import type { ElementType, ReactNode } from "react";
import styles from "./MicroLabel.module.css";

/** Index labels, legal keys, film caption (DESIGN §9.2). Text only. */
export function MicroLabel({ as: Tag = "p", children, className, ...rest }: { as?: ElementType; children: ReactNode; className?: string; id?: string; [key: `data-${string}`]: string | undefined }) {
  return (
    <Tag className={["t-micro", styles.label, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}
