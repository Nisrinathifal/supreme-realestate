"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DotsNine } from "@phosphor-icons/react/dist/ssr";
import { Lockup } from "@/components/brand/Lockup";
import { toneLine } from "@/components/motion/BgShift";
import { Flag } from "./Flag";
import { HEADLINE_IN } from "@/components/sections/HeroFilm";
import { langs, pageForPath, pathFor, type Lang } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";
import { ease, gsap, prefersReducedMotion, ScrollTrigger, setupGsap } from "@/lib/motion";
import styles from "./Header.module.css";

/**
 * Fired on <document> by a band that turns dark on its own: detail "dark" | "light" (the hero at night), or
 * { key, dark } for any other source (the projects band, which fades to light as the page moves on).
 */
export const HEADER_THEME = "supreme:header-theme";
/** Fired on <document> by the project overlay (components/windows): detail = the open project's number (1–4) or null. */
export const PROJECT_STATE = "supreme:project-state";
/** Dark sources on screen (dark bands, the hero at night): the bar is Paper while any of them is active. */
const darkSources = new Set<string>();

export type HeaderStrings = {
  home: string;
  wordmark: string;
  menu: string;
  closeMenu: string;
  mainNav: string;
  langSwitch: string;
  switchTo: string;
  nl: string;
  en: string;
  contactUs: string;
  contact: string;
  sections: { id: string; label: string }[];
  keys: { address: string; email: string };
  addressLines: string[];
  email: string;
};

type Props = { lang: Lang; strings: HeaderStrings };

/**
 * Header (concept 2026-10-05, after the owner's reference): the lockup left; right, a small round language button
 * showing the current language's code (hover brings the flags: the current one half aside and dimmed, the other
 * language's behind it, with the hint "Switch to English" beside it) and a nine-dot menu button that opens the glass panel (DESIGN §9.4) on hover (mouse)
 * or click/keyboard with the homepage sections, the contact page and the company address and e-mail. No contact
 * button. No veil behind it: it changes colour with the page's tone (owner, 2026-10-08). On the homepage the bar waits out of
 * sight until the headline comes in (HeroBoat says when) and then arrives; elsewhere it is simply there.
 * Fixed over the hero; without JavaScript it sits absolutely at the top, visible, and the panel stays closed.
 */
export function Header({ lang, strings }: Props) {
  const pathname = usePublicPathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);
  const home = pathFor("home", lang);
  const onHome = pathname === home;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const setDark = (key: string, on: boolean) => {
    if (on) darkSources.add(key);
    else darkSources.delete(key);
    setTheme(darkSources.size ? "dark" : "light");
  };
  const [hidden, setHidden] = useState(false);
  const [project, setProject] = useState<number | null>(null); // a project page open over the homepage

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

  // Bands marked data-header-theme="dark" switch the bar to Paper while they sit under it
  useEffect(() => {
    setupGsap();
    const bands = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme="dark"]'));
    if (!bands.length) return;
    // A band may be pinned by its own motion: then its scroll range is the pin's range plus the band's height.
    // Evaluated after the pins refresh (priority -1), so the pin's start/end are final.
    const pinOf = (band: HTMLElement) => ScrollTrigger.getAll().find((t) => t.pin === band);
    // Between two bands that both fill with the page's tone (BgShift) the whole screen changes colour at the tone line,
    // so the bar turns there too, not when the seam reaches it
    const tones = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]"));
    const fills = (el: Element | null | undefined) => Boolean(el?.hasAttribute("data-tone-fill"));
    const outer = (band: HTMLElement) => (band.parentElement?.classList.contains("pin-spacer") ? band.parentElement : band);
    const prevOf = (band: HTMLElement) => outer(band).previousElementSibling;
    const nextOf = (band: HTMLElement) => outer(band).nextElementSibling ?? tones[tones.indexOf(band) + 1] ?? null;
    // the seam's tone line: where the later of the two bands takes over
    const at = (band: HTMLElement, neighbour: Element | null, later: Element | null) => (fills(band) && fills(neighbour) ? window.innerHeight * toneLine(later) : 48);
    const triggers = bands.map((band, i) =>
      ScrollTrigger.create({
        trigger: band,
        start: () => {
          const pin = pinOf(band);
          return (pin ? pin.start : band.getBoundingClientRect().top + window.scrollY) - (band.dataset.toneLead && fills(band) ? window.innerHeight * toneLine(band) : at(band, prevOf(band), band)); // a band that leads (the letter after the About band's dusk) takes the bar when it takes the tone
        },
        end: () => {
          const pin = pinOf(band);
          // A following band marked data-overlap slides up over the held band one viewport early
          const overlap = outer(band).nextElementSibling?.hasAttribute("data-overlap") ? window.innerHeight : 0;
          return (pin ? pin.end + band.offsetHeight - overlap : band.getBoundingClientRect().bottom + window.scrollY) - at(band, nextOf(band), nextOf(band));
        },
        refreshPriority: -1,
        onToggle: (self) => setDark(`band-${i}`, self.isActive),
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      bands.forEach((_, i) => darkSources.delete(`band-${i}`));
      setTheme(darkSources.size ? "dark" : "light");
    };
  }, [pathname]);

  // On the homepage the bar arrives with the headline; without that cue it comes anyway after a while
  useEffect(() => {
    const el = headerRef.current;
    if (!el || !onHome || prefersReducedMotion()) return;
    setupGsap();
    let done = false;
    el.dataset.arriving = "true"; // its CSS transitions step aside for the tween
    gsap.set(el, { autoAlpha: 0, y: -10 });
    const arrive = () => {
      if (done) return;
      done = true;
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: ease.brand,
        clearProps: "opacity,visibility,transform",
        onComplete: () => delete el.dataset.arriving,
      });
    };
    document.addEventListener(HEADLINE_IN, arrive, { once: true });
    const fallback = window.setTimeout(arrive, 7000);
    return () => {
      window.clearTimeout(fallback);
      document.removeEventListener(HEADLINE_IN, arrive);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "opacity,visibility,transform" });
      delete el.dataset.arriving;
    };
  }, [onHome]);

  // A band that turns dark on its own (the hero as the scroll brings night) says so
  useEffect(() => {
    const onTheme = (e: Event) => {
      const d = (e as CustomEvent<"dark" | "light" | { key: string; dark: boolean }>).detail;
      if (typeof d === "string") setDark("hero", d === "dark");
      else setDark(d.key, d.dark);
    };
    document.addEventListener(HEADER_THEME, onTheme);
    return () => {
      document.removeEventListener(HEADER_THEME, onTheme);
      darkSources.delete("hero");
    };
  }, []);

  // Over a project page the bar always shows, and the language button keeps the project (?project=n)
  useEffect(() => {
    const onProject = (e: Event) => setProject((e as CustomEvent<number | null>).detail);
    document.addEventListener(PROJECT_STATE, onProject);
    return () => document.removeEventListener(PROJECT_STATE, onProject);
  }, []);

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
  // The language button leads to the same page in the other language
  const other = langs.find((l) => l !== lang) ?? lang;
  const current = pageForPath(pathname);
  const otherHref = (current ? pathFor(current.page, other) : pathFor("home", other)) + (project ? `?project=${project}` : "");

  return (
    <header ref={headerRef} className={styles.header} data-header data-theme={theme} data-hidden={hidden && !project ? "true" : "false"}>
      <div className={`container ${styles.bar}`}>
        <Lockup href={home} ariaLabel={strings.home} className={styles.lockup} height={40} tone={theme === "dark" ? "light" : "ink"} />

        <div className={styles.right}>
          <Link href={otherHref} hrefLang={other} lang={other} className={styles.lang} aria-label={strings.switchTo}>
            <span className={styles.langHint} aria-hidden="true">
              {strings.switchTo}
            </span>
            <span className={styles.flagWrap}>
              <span className={styles.langCode} aria-hidden="true">
                {lang.toUpperCase()}
              </span>
              <Flag lang={other} className={styles.flagBack} />
              <Flag lang={lang} className={styles.flagFront} />
            </span>
          </Link>

          <div className={styles.menuWrap} onPointerEnter={onEnter} onPointerLeave={onLeave}>
            <button ref={buttonRef} type="button" className={styles.menu} aria-expanded={open} aria-controls={panelId} aria-label={open ? strings.closeMenu : strings.menu} onClick={toggle}>
              <DotsNine size={26} weight="bold" aria-hidden="true" />
            </button>

            {/* The wrapper carries the gap below the button so the pointer can travel into the panel without closing it.
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
                  {/* Address and e-mail (owner, 2026-10-07: e-mail instead of the phone): verified values from
                      company.json (PRD §7); the layout decides. */}
                  <dl className={styles.details}>
                    <div className={styles.row}>
                      <dt className="t-micro">{strings.keys.address}</dt>
                      <dd className={styles.value}>
                        {strings.addressLines.map((l) => (
                          <span key={l}>{l}</span>
                        ))}
                      </dd>
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
        </div>
      </div>
    </header>
  );
}
