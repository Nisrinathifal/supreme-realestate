import type { Metadata, Viewport } from "next";
import { Funnel_Display, Inter_Tight } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { LangProvider } from "@/components/layout/LangProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { company, formatAddressLines, has, telHref } from "@/content/company";
import { getCopy } from "@/content/copy";
import { langs } from "@/content/routes";
import { htmlLang, resolveLang } from "@/lib/i18n";
import { organizationJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import "@/styles/tokens.css";
import "@/styles/base.css";

const display = Funnel_Display({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-display-src", display: "swap", preload: true });
const text = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-text-src", display: "swap", preload: true });

/** Only nl and en exist; anything else is an unmatched route and gets the global 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

const noindex = process.env.NEXT_PUBLIC_NOINDEX === "1";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = resolveLang((await params).lang);
  const c = getCopy(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: c.meta.homeTitle, template: `%s · ${c.siteName}` },
    description: c.meta.description,
    applicationName: c.siteName,
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#1A201D",
  width: "device-width",
  initialScale: 1,
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const lang = resolveLang((await params).lang);
  const c = getCopy(lang);
  const jsonLd = organizationJsonLd(lang);
  return (
    <html lang={htmlLang(lang)} className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <body>
        {/* Repeat visit in this tab: flag the intro as shown before first paint so the preloader never flashes.
            In development the intro plays on every load so it can be reviewed. */}
        {process.env.NODE_ENV === "development" ? null : (
          <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("preloaderShown")==="1")document.documentElement.setAttribute("data-preloader-skip","")}catch(e){}` }} />
        )}
        <LangProvider lang={lang}>
        <SmoothScroll />
        <noscript>
          <style>{`[data-header]{position:absolute !important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          {c.a11y.skip}
        </a>
        <Header
          lang={lang}
          strings={{
            home: c.a11y.home,
            wordmark: c.brand.wordmark,
            menu: c.nav.menu,
            closeMenu: c.nav.closeMenu,
            mainNav: c.a11y.mainNav,
            langSwitch: c.a11y.languageSwitch,
            nl: c.a11y.nl,
            en: c.a11y.en,
            contactUs: c.nav.contactUs,
            contact: c.nav.contact,
            sections: c.nav.sections,
            keys: { address: c.companyKeys.visitingAddress, phone: c.companyKeys.phone, email: c.companyKeys.email },
            addressLines: formatAddressLines(company.visitingAddress),
            phone: has(company.phone) ? company.phone : "",
            phoneHref: has(company.phone) ? telHref(company.phone) : "",
            email: has(company.email) ? company.email : "",
          }}
        />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LangProvider>
      </body>
    </html>
  );
}
