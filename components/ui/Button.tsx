import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "outline" | "glass" | "text";
type Common = { variant?: Variant; size?: "md" | "lg"; arrow?: boolean; external?: boolean; children: ReactNode; className?: string };
type LinkProps = Common & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href" | "children">;
type ButtonProps = Common & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "children">;

/** DESIGN §9.1 (+ `outline`: transparent, 1px ink border, for the header over the hero). One `primary` per view. Hover moves the arrow 3px, nothing else. */
export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", size = "md", arrow = false, external = false, children, className, ...rest } = props;
  const cls = [styles.btn, styles[variant], size === "lg" ? styles.lg : "", className].filter(Boolean).join(" ");
  const Icon = external ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span>{children}</span>
      {arrow ? <Icon size={size === "lg" ? 20 : 18} weight="light" className={styles.arrow} aria-hidden="true" /> : null}
    </>
  );
  if ("href" in props && props.href !== undefined) {
    const { href, ...a } = rest as LinkProps;
    if (external || /^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a href={href} className={cls} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined} {...a}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...a}>
        {content}
      </Link>
    );
  }
  const b = rest as ButtonProps;
  return (
    <button type="button" className={cls} {...b}>
      {content}
    </button>
  );
}
