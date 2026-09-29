import type { Metadata } from "next";
import { getCopy } from "@/content/copy";
import { langs, pathFor, type Lang, type PageKey } from "@/content/routes";
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
