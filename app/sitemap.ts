import type { MetadataRoute } from "next";
import { langs, pathFor, routes, workCount, workPathFor, type PageKey } from "@/content/routes";
import { absoluteUrl } from "@/lib/site";
import { languageAlternates, workAlternates } from "@/lib/seo";

export const dynamic = "force-static";

/** All public pages and the work cases in both languages with hreflang alternates. Nothing else is listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const page of Object.keys(routes) as PageKey[]) {
    for (const lang of langs) {
      out.push({
        url: absoluteUrl(pathFor(page, lang)),
        changeFrequency: page === "home" ? "monthly" : "yearly",
        priority: page === "home" ? 1 : page === "about" || page === "contact" ? 0.8 : 0.3,
        alternates: { languages: languageAlternates(page) },
      });
    }
  }
  for (let i = 0; i < workCount; i++) {
    for (const lang of langs) {
      out.push({ url: absoluteUrl(workPathFor(i, lang)), changeFrequency: "yearly", priority: 0.5, alternates: { languages: workAlternates(i) } });
    }
  }
  return out;
}
