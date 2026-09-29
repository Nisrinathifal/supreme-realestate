"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DotsThreeVertical, X } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { Dakvenster } from "@/components/brand/Dakvenster";
import { LangToggle } from "./LangToggle";
import { pathFor, type Lang, type PageKey } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";
import styles from "./Header.module.css";

export type HeaderStrings = {
  home: string;
  wordmark: string;
  about: string;
  contact: string;
  menu: string;
  closeMenu: string;
  mainNav: string;
  langSwitch: string;
  nl: string;
  en: string;
  email: string;
  phone: string;
  phoneHref: string;
  primary: string;
};

type Props = { lang: Lang; strings: HeaderStrings };

const navPages: { key: PageKey; label: "about" | "contact" }[] = [
  { key: "about", label: "about" },
  { key: "contact", label: "contact" },
];

/**
 * Header after the reference (REFERENCE §3): lockup left; right a dark primary pill and a light
 * "Menu" pill that opens the full-screen sheet with Over ons, Contact, NL/EN and the company contact.
 * Fixed; becomes a glass bar after 80px. Without JS it sits absolutely at the top.
 */
export function Header({ lang, strings }: Props) {
  const pathname = usePublicPathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const closeOnNavigate = () => setOpen(false);
  const isCurrent = (key: PageKey) => pathname === pathFor(key, lang);

  return (
    <header className={styles.header} data-scrolled={scrolled ? "true" : "false"} data-header>
      <div className={`container ${styles.bar}`}>
        <Lockup href={pathFor("home", lang)} wordmark={strings.wordmark} ariaLabel={strings.home} className={styles.lockup} />
        <div className={styles.right}>
          <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
          <Link href={pathFor("contact", lang)} className={`${styles.pill} ${styles.pillPrimary}`}>
            {strings.primary}
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className={`${styles.pill} ${styles.pillLight}`}
            aria-expanded={open}
            aria-controls="menu-sheet"
            onClick={() => setOpen(true)}
          >
            <span>{strings.menu}</span>
            <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        id="menu-sheet"
        ref={dialogRef}
        className={styles.sheet}
        aria-label={strings.menu}
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className={`container ${styles.sheetInner}`}>
          <div className={styles.sheetTop}>
            <span onClick={closeOnNavigate}>
              <Lockup href={pathFor("home", lang)} wordmark={strings.wordmark} ariaLabel={strings.home} />
            </span>
            <button type="button" className={`${styles.pill} ${styles.pillLight}`} onClick={close} autoFocus>
              <span>{strings.closeMenu}</span>
              <X size={18} weight="light" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label={strings.mainNav}>
            <ul className={styles.sheetList}>
              {navPages.map((p, i) => (
                <li key={p.key}>
                  <Link href={pathFor(p.key, lang)} className={styles.sheetLink} aria-current={isCurrent(p.key) ? "page" : undefined} onClick={closeOnNavigate}>
                    <span className="t-micro">{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.sheetLabel}>{strings[p.label]}</span>
                    {isCurrent(p.key) ? <Dakvenster size={8} /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.sheetBottom}>
            <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
            <div className={`t-legal ${styles.sheetContact}`}>
              {strings.email ? <a href={`mailto:${strings.email}`}>{strings.email}</a> : null}
              {strings.phone ? <a href={strings.phoneHref}>{strings.phone}</a> : null}
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
