export type Lang = "nl" | "en";
export const langs: Lang[] = ["nl", "en"];
export const defaultLang: Lang = "nl";

export type PageKey = "home" | "about" | "contact" | "privacy" | "cookies" | "disclaimer" | "colophon";

/** Translated slugs per PRD §5.1. Empty string = language root. */
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { nl: "", en: "" },
  about: { nl: "over-ons", en: "about" },
  contact: { nl: "contact", en: "contact" },
  privacy: { nl: "privacy", en: "privacy" },
  cookies: { nl: "cookies", en: "cookies" },
  disclaimer: { nl: "disclaimer", en: "disclaimer" },
  colophon: { nl: "colofon", en: "colophon" },
};

export const legalPages: PageKey[] = ["privacy", "cookies", "disclaimer", "colophon"];

/** Public path for a page in a language. NL lives at the root, EN under /en. */
export function pathFor(page: PageKey, lang: Lang): string {
  const slug = routes[page][lang];
  const prefix = lang === defaultLang ? "" : `/${lang}`;
  const path = `${prefix}/${slug}`.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

/** Page key for a slug in a language, or null. */
export function pageForSlug(lang: Lang, slug: string): PageKey | null {
  const entry = (Object.keys(routes) as PageKey[]).find((k) => routes[k][lang] === slug);
  return entry ?? null;
}

/** Page key for a public pathname (either language), or null. */
export function pageForPath(pathname: string): { page: PageKey; lang: Lang } | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const lang of langs) {
    for (const page of Object.keys(routes) as PageKey[]) {
      if (pathFor(page, lang) === clean) return { page, lang };
    }
  }
  return null;
}

/* Work cases (concept 2026-10-02): detail pages under a translated base, numbered slugs (no names: PRD §6). */
export const workBase: Record<Lang, string> = { nl: "werk", en: "work" };
export const workCount = 4;
export const workSlug = (index: number) => `project-${String(index + 1).padStart(2, "0")}`;

/** Public path of a work case (0-based index) in a language. */
export function workPathFor(index: number, lang: Lang): string {
  const prefix = lang === defaultLang ? "" : `/${lang}`;
  return `${prefix}/${workBase[lang]}/${workSlug(index)}`;
}

/** Case index for a two-segment slug in a language, or null. */
export function workForSlug(lang: Lang, slug: string[]): number | null {
  if (slug.length !== 2 || slug[0] !== workBase[lang]) return null;
  const index = Array.from({ length: workCount }, (_, i) => i).find((i) => workSlug(i) === slug[1]);
  return index ?? null;
}

/** Case index and language for a public pathname, or null. */
export function workForPath(pathname: string): { index: number; lang: Lang } | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const lang of langs) {
    for (let i = 0; i < workCount; i++) if (workPathFor(i, lang) === clean) return { index: i, lang };
  }
  return null;
}

export function isLang(v: string): v is Lang {
  return (langs as string[]).includes(v);
}
