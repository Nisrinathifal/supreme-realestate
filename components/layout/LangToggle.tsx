"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { langs, pageForPath, pathFor, type Lang } from "@/content/routes";
import styles from "./LangToggle.module.css";

type Props = { lang: Lang; labels: { switch: string; nl: string; en: string } };

/** NL / EN text links with a hairline between (DESIGN §9.9). Keeps the visitor on the equivalent page. */
export function LangToggle({ lang, labels }: Props) {
  const pathname = usePathname();
  const current = pageForPath(pathname ?? "/");
  return (
    <nav aria-label={labels.switch} className={styles.toggle}>
      {langs.map((l, i) => {
        const href = current ? pathFor(current.page, l) : pathFor("home", l);
        const active = l === lang;
        return (
          <span key={l} className={styles.item}>
            {i > 0 ? <span className={styles.sep} aria-hidden="true" /> : null}
            <Link
              href={href}
              hrefLang={l}
              lang={l}
              aria-current={active ? "true" : undefined}
              aria-label={l === "nl" ? labels.nl : labels.en}
              className={[styles.link, active ? styles.active : ""].filter(Boolean).join(" ")}
            >
              {l.toUpperCase()}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
