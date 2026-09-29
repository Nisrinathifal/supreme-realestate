"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { Dakvenster } from "@/components/brand/Dakvenster";
import { LangToggle } from "./LangToggle";
import { pathFor, type Lang, type PageKey } from "@/content/routes";
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
};

type Props = { lang: Lang; strings: HeaderStrings };

const navPages: { key: PageKey; label: keyof Pick<HeaderStrings, "about" | "contact"> }[] = [
  { key: "about", label: "about" },
  { key: "contact", label: "contact" },
];

/**
 * Header (DESIGN §9.8): lockup, Over ons, Contact, NL/EN. Fixed; becomes a glass bar after 80px.
 * Over the hero film it uses --on-media. Without JS it sits absolutely at the top (see layout <noscript>).
 */
export function Header({ lang, strings }: Props) {
  const pathname = usePathname();
  // Over-media colours apply only while a hero film is on the page (CSS: body:has([data-hero-film])).
  const isHome = pathname === pathFor("home", lang);
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

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    return () => document.documentElement.classList.remove("menu-open");
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const closeOnNavigate = () => setOpen(false);

  const isCurrent = (key: PageKey) => pathname === pathFor(key, lang);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled ? "true" : "false"}
      data-home={isHome && !scrolled ? "true" : "false"}
      data-header
    >
      <div className={`container ${styles.bar}`}>
        <Lockup href={pathFor("home", lang)} wordmark={strings.wordmark} ariaLabel={strings.home} className={styles.lockup} />
        <nav aria-label={strings.mainNav} className={styles.nav}>
          <ul className={styles.list}>
            {navPages.map((p) => {
              const current = isCurrent(p.key);
              return (
                <li key={p.key}>
                  <Link href={pathFor(p.key, lang)} aria-current={current ? "page" : undefined} className={styles.link}>
                    {strings[p.label]}
                    {current ? <Dakvenster size={6} className={styles.dot} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.right}>
          <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
          <button
            ref={buttonRef}
            type="button"
            className={`${styles.menuBtn} t-ui`}
            aria-expanded={open}
            aria-controls="menu-sheet"
            onClick={() => setOpen(true)}
          >
            <List size={20} weight="light" aria-hidden="true" />
            <span>{strings.menu}</span>
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
            <button type="button" className={`${styles.menuBtn} t-ui`} onClick={close} autoFocus>
              <X size={20} weight="light" aria-hidden="true" />
              <span>{strings.closeMenu}</span>
            </button>
          </div>
          <nav aria-label={strings.mainNav}>
            <ul className={styles.sheetList}>
              {navPages.map((p, i) => (
                <li key={p.key}>
                  <Link href={pathFor(p.key, lang)} className={styles.sheetLink} aria-current={isCurrent(p.key) ? "page" : undefined} onClick={closeOnNavigate}>
                    <span className="t-micro">{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.sheetLabel}>{strings[p.label]}</span>
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
