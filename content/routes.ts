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

export function isLang(v: string): v is Lang {
  return (langs as string[]).includes(v);
}
