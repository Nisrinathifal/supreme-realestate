"use client";

import Link from "next/link";
import { langs, pageForPath, pathFor, type Lang } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";
import styles from "./LangToggle.module.css";

type Props = { lang: Lang; labels: { switch: string; nl: string; en: string } };

/** Small inline flags (no emoji: Windows renders none). Decorative; the link carries the language name. */
function Flag({ lang }: { lang: Lang }) {
  if (lang === "nl") {
    return (
      <svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true" focusable="false" className={styles.flag}>
        <rect width="18" height="4" y="0" fill="#AE1C28" />
        <rect width="18" height="4" y="4" fill="#FFFFFF" />
        <rect width="18" height="4" y="8" fill="#21468B" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true" focusable="false" className={styles.flag}>
      <rect width="18" height="12" fill="#012169" />
      <path d="M0 0L18 12M18 0L0 12" stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M0 0L18 12M18 0L0 12" stroke="#C8102E" strokeWidth="1" />
      <path d="M9 0V12M0 6H18" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M9 0V12M0 6H18" stroke="#C8102E" strokeWidth="2.2" />
    </svg>
  );
}

/** NL / EN links with flags and a hairline between (DESIGN §9.9). Keeps the visitor on the equivalent page. */
export function LangToggle({ lang, labels }: Props) {
  const pathname = usePublicPathname();
  const current = pageForPath(pathname);
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
              <Flag lang={l} />
              <span>{l.toUpperCase()}</span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
