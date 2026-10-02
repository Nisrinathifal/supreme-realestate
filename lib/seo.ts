import type { Metadata } from "next";
import { getCopy } from "@/content/copy";
import { langs, pathFor, workPathFor, type Lang, type PageKey } from "@/content/routes";
import { absoluteUrl } from "./site";

/** hreflang map for a page: nl, en and x-default (nl) per PRD §9.1 / DESIGN §15. */
export function languageAlternates(page: PageKey): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of langs) map[l] = absoluteUrl(pathFor(page, l));
  map["x-default"] = absoluteUrl(pathFor(page, "nl"));
  return map;
}

export function pageMetadata(lang: Lang, page: PageKey): Metadata {
  const c = getCopy(lang);
  const isHome = page === "home";
  const title = isHome ? c.meta.homeTitle : c.meta.titlePattern(c.meta.pages[page].title);
  const description = isHome ? c.meta.description : c.meta.pages[page].description;
  const path = pathFor(page, lang);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(path), languages: languageAlternates(page) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: c.siteName,
      locale: lang === "nl" ? "nl_NL" : "en_GB",
      alternateLocale: lang === "nl" ? ["en_GB"] : ["nl_NL"],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** hreflang map for a work case. */
export function workAlternates(index: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of langs) map[l] = absoluteUrl(workPathFor(index, l));
  map["x-default"] = absoluteUrl(workPathFor(index, "nl"));
  return map;
}

/** Metadata for a work case: its (draft) title in the site pattern, its one line as description. */
export function workMetadata(lang: Lang, index: number): Metadata {
  const c = getCopy(lang);
  const item = c.work.items[index];
  const title = c.meta.titlePattern(item.title);
  const description = item.body;
  const path = workPathFor(index, lang);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(path), languages: workAlternates(index) },
    openGraph: { title, description, url: absoluteUrl(path), siteName: c.siteName, locale: lang === "nl" ? "nl_NL" : "en_GB", alternateLocale: lang === "nl" ? ["en_GB"] : ["nl_NL"], type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}
