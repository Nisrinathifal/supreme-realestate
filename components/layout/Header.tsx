"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DotsSixVertical, X } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "./LangToggle";
import { pathFor, type Lang } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";
import styles from "./Header.module.css";

export type HeaderStrings = {
  home: string;
  wordmark: string;
  menu: string;
  closeMenu: string;
  mainNav: string;
  langSwitch: string;
  nl: string;
  en: string;
  contactUs: string;
  contact: string;
  sections: { id: string; label: string }[];
  keys: { address: string; phone: string; email: string };
  addressLines: string[];
  phone: string;
  phoneHref: string;
  email: string;
};

type Props = { lang: Lang; strings: HeaderStrings };

/**
 * Header (concept 2026-10-01): menu pill left that opens a glass panel (DESIGN §9.4) with the homepage
 * sections, the contact page, the language switch on small screens and the verified contact details;
 * the lockup on the centre line; NL/EN and the one `primary` button ("Contact us") right. Fixed over the
 * hero; without JavaScript it sits absolutely at the top and the panel stays closed.
 */
export function Header({ lang, strings }: Props) {
  const pathname = usePublicPathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const home = pathFor("home", lang);
  const onHome = pathname === home;

  // Close on Escape, on a click outside and on navigation; return focus to the pill when closed via keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const sectionHref = (id: string) => (onHome ? `#${id}` : `${home === "/" ? "" : home}/#${id}`);
  const hasContact = strings.addressLines.length > 0 || strings.phone || strings.email;

  return (
    <header className={styles.header} data-header>
      <div className={`container ${styles.bar}`}>
        <div className={styles.left}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.pill}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? strings.closeMenu : strings.menu}</span>
            {open ? <X size={16} weight="light" aria-hidden="true" /> : <DotsSixVertical size={16} weight="bold" aria-hidden="true" />}
          </button>

          <div id={panelId} ref={panelRef} className={styles.panel} hidden={!open}>
            <nav aria-label={strings.mainNav}>
              <ul className={styles.list}>
                {strings.sections.map((s) => (
                  <li key={s.id}>
                    <a href={sectionHref(s.id)} className={styles.link} onClick={() => setOpen(false)}>
                      {s.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href={pathFor("contact", lang)} className={styles.link} aria-current={pathname === pathFor("contact", lang) ? "page" : undefined} onClick={() => setOpen(false)}>
                    {strings.contact}
                  </Link>
                </li>
              </ul>
            </nav>
            <div className={styles.panelLang}>
              <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
            </div>
            {hasContact ? (
              <dl className={styles.details}>
                {strings.addressLines.length ? (
                  <div className={styles.row}>
                    <dt className="t-micro">{strings.keys.address}</dt>
                    <dd className={styles.value}>
                      {strings.addressLines.map((l) => (
                        <span key={l}>{l}</span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {strings.phone ? (
                  <div className={styles.row}>
                    <dt className="t-micro">{strings.keys.phone}</dt>
                    <dd className={styles.value}>
                      <a href={strings.phoneHref}>{strings.phone}</a>
                    </dd>
                  </div>
                ) : null}
                {strings.email ? (
                  <div className={styles.row}>
                    <dt className="t-micro">{strings.keys.email}</dt>
                    <dd className={styles.value}>
                      <a href={`mailto:${strings.email}`}>{strings.email}</a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        </div>

        <Lockup href={home} ariaLabel={strings.home} className={styles.lockup} height={44} />

        <div className={styles.right}>
          <div className={styles.barLang}>
            <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
          </div>
          <Button href={pathFor("contact", lang)} variant="primary" className={styles.cta}>
            <span className={styles.ctaLong}>{strings.contactUs}</span>
            <span className={styles.ctaShort}>{strings.contact}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
