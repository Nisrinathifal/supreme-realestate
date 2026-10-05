"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "./LangToggle";
import { pathFor, type Lang } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";
import { ScrollTrigger, setupGsap } from "@/lib/motion";
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
 * Header (concept 2026-10-01): "Navigate to" pill left that opens a glass panel (DESIGN §9.4) on hover (mouse)
 * or click/keyboard (touch, keyboard) with the homepage sections, the contact page, the language switch on
 * small screens and the company address and phone; the lockup on the centre line; plain NL | EN and the
 * outline "Contact us" button right. A soft Paper veil behind the bar keeps it legible over every band.
 * Fixed over the hero; without JavaScript it sits absolutely at the top and the panel stays closed.
 */
export function Header({ lang, strings }: Props) {
  const pathname = usePublicPathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);
  const home = pathFor("home", lang);
  const onHome = pathname === home;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hidden, setHidden] = useState(false);
  const [veil, setVeil] = useState(true);

  // The bar leaves once the page has scrolled away over the footer (the sticky footer itself cannot be
  // measured, so the trigger is the end of <main>: from the moment its bottom passes 60% of the viewport)
  useEffect(() => {
    setupGsap();
    const main = document.getElementById("main");
    if (!main || !document.querySelector("[data-footer]")) return;
    const t = ScrollTrigger.create({
      trigger: main,
      start: "bottom 60%",
      end: "+=100000",
      refreshPriority: -1,
      onToggle: (self) => setHidden(self.isActive),
    });
    return () => t.kill();
  }, [pathname]);

  // Bands marked data-header-theme="dark" switch the bar to Paper on a dark veil while they sit under it
  useEffect(() => {
    setupGsap();
    const bands = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme="dark"]'));
    if (!bands.length) return;
    // A band may be pinned by its own motion: then its scroll range is the pin's range plus the band's height.
    // Evaluated after the pins refresh (priority -1), so the pin's start/end are final.
    const pinOf = (band: HTMLElement) => ScrollTrigger.getAll().find((t) => t.pin === band);
    const triggers = bands.map((band) =>
      ScrollTrigger.create({
        trigger: band,
        start: () => {
          const pin = pinOf(band);
          return (pin ? pin.start : band.getBoundingClientRect().top + window.scrollY) - 48;
        },
        end: () => {
          const pin = pinOf(band);
          // A following band marked data-overlap slides up over the held band one viewport early
          const overlap = band.nextElementSibling?.hasAttribute("data-overlap") ? window.innerHeight : 0;
          return (pin ? pin.end + band.offsetHeight - overlap : band.getBoundingClientRect().bottom + window.scrollY) - 48;
        },
        refreshPriority: -1,
        onToggle: (self) => setTheme(self.isActive ? "dark" : "light"),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [pathname]);

  // A band marked data-header-veil="off" (the sky hero, which carries its own copy right under the bar) drops the
  // light veil while it sits under the bar, so the veil never washes out that copy
  useEffect(() => {
    setupGsap();
    const band = document.querySelector<HTMLElement>('[data-header-veil="off"]');
    if (!band) return;
    const t = ScrollTrigger.create({
      trigger: band,
      start: "top bottom",
      end: "bottom 120px",
      onToggle: (self) => setVeil(!self.isActive),
    });
    return () => {
      t.kill();
      setVeil(true);
    };
  }, [pathname]);

  // Close on Escape and on a click outside; return focus to the pill when closed via keyboard
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
    const onScroll = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  const cancelLeave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancelLeave();
    setOpen(true);
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => setOpen(false), 180);
  };
  const toggle = () => {
    cancelLeave();
    setOpen((v) => {
      if (!v) window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a, button")?.focus(), 0);
      return !v;
    });
  };
  const close = () => {
    cancelLeave();
    setOpen(false);
  };

  const sectionHref = (id: string) => (onHome ? `#${id}` : `${home === "/" ? "" : home}/#${id}`);

  return (
    <header className={styles.header} data-header data-theme={theme} data-veil={veil ? "on" : "off"} data-hidden={hidden ? "true" : "false"}>
      <div className={`container ${styles.bar}`}>
        <div className={styles.left} onPointerEnter={onEnter} onPointerLeave={onLeave}>
          <button ref={buttonRef} type="button" className={styles.pill} aria-expanded={open} aria-controls={panelId} aria-label={open ? strings.closeMenu : undefined} onClick={toggle}>
            <span>{strings.menu}</span>
            <DotsSixVertical size={16} weight="bold" aria-hidden="true" />
          </button>

          {/* The wrapper carries the gap below the pill so the pointer can travel into the panel without closing it.
              Closed: collapsed to zero height (grid rows) and visibility hidden after the move, so nothing inside is focusable. */}
          <div className={styles.panelWrap} data-open={open ? "true" : "false"}>
            <div className={styles.panelClip}>
            <div id={panelId} ref={panelRef} className={styles.panel}>
              <nav aria-label={strings.mainNav}>
                <ul className={styles.list}>
                  {strings.sections.map((s) => (
                    <li key={s.id}>
                      <a href={sectionHref(s.id)} className={styles.link} onClick={close}>
                        {s.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link href={pathFor("contact", lang)} className={styles.link} aria-current={pathname === pathFor("contact", lang) ? "page" : undefined} onClick={close}>
                      {strings.contact}
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className={styles.panelLang}>
                <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
              </div>
              {/* Address and phone: verified values from company.json (PRD §7), or the fictional stand-ins from the
                  copy until then (the layout decides; a stand-in phone has no tel: link). */}
              <dl className={styles.details}>
                <div className={styles.row}>
                  <dt className="t-micro">{strings.keys.address}</dt>
                  <dd className={styles.value}>
                    {strings.addressLines.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt className="t-micro">{strings.keys.phone}</dt>
                  <dd className={styles.value}>{strings.phoneHref ? <a href={strings.phoneHref}>{strings.phone}</a> : <span>{strings.phone}</span>}</dd>
                </div>
                {strings.email ? (
                  <div className={styles.row}>
                    <dt className="t-micro">{strings.keys.email}</dt>
                    <dd className={styles.value}>
                      <a href={`mailto:${strings.email}`}>{strings.email}</a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            </div>
          </div>
        </div>

        <Lockup href={home} ariaLabel={strings.home} className={styles.lockup} height={44} tone={theme === "dark" ? "light" : "ink"} />

        <div className={styles.right}>
          <div className={styles.barLang}>
            <LangToggle lang={lang} labels={{ switch: strings.langSwitch, nl: strings.nl, en: strings.en }} />
          </div>
          <Button href={pathFor("contact", lang)} variant="outline" className={styles.cta}>
            <span className={styles.ctaLong}>{strings.contactUs}</span>
            <span className={styles.ctaShort}>{strings.contact}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
