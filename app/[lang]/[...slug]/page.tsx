import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { AboutPage } from "@/components/pages/AboutPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { LegalPage } from "@/components/pages/LegalPage";
import { isLang, langs, legalPages, pageForSlug, routes, type Lang, type PageKey } from "@/content/routes";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ lang: string; slug: string[] }> };

/** Unknown slugs are unmatched routes: Next serves app/global-not-found.tsx (static, server-rendered). */
export const dynamicParams = false;

export function generateStaticParams() {
  const out: { lang: Lang; slug: string[] }[] = [];
  for (const lang of langs) {
    for (const key of Object.keys(routes) as PageKey[]) {
      const slug = routes[key][lang];
      if (slug) out.push({ lang, slug: [slug] });
    }
  }
  return out;
}

async function match(params: Params["params"]): Promise<{ lang: Lang; page: PageKey } | null> {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang) || slug.length !== 1) return null;
  const page = pageForSlug(rawLang, slug[0]);
  if (!page || page === "home") return null;
  return { lang: rawLang, page };
}

/** Metadata never throws: a thrown notFound() here makes Next skip server rendering of the 404. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const m = await match(params);
  return m ? pageMetadata(m.lang, m.page) : {};
}

export default async function Page({ params }: Params) {
  const m = await match(params);
  if (!m) notFound();
  const { lang, page } = m;
  // The footer belongs to the secondary pages only while the homepage is rebuilt section by section.
  const body =
    page === "about" ? (
      <AboutPage lang={lang} />
    ) : page === "contact" ? (
      <ContactPage lang={lang} />
    ) : legalPages.includes(page) ? (
      <LegalPage lang={lang} page={page as "privacy" | "cookies" | "disclaimer" | "colophon"} />
    ) : null;
  if (!body) notFound();
  return (
    <>
      {body}
      <Footer lang={lang} />
    </>
  );
}
