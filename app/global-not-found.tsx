import type { Metadata, Viewport } from "next";
import { Funnel_Display, Inter_Tight } from "next/font/google";
import { Lockup } from "@/components/brand/Lockup";
import { Footer } from "@/components/layout/Footer";
import { NotFoundView } from "@/components/pages/NotFoundView";
import { getCopy } from "@/content/copy";
import { pathFor } from "@/content/routes";
import "@/styles/tokens.css";
import "@/styles/base.css";
import styles from "./global-not-found.module.css";

const display = Funnel_Display({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-display-src", display: "swap" });
const text = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-text-src", display: "swap" });

const nl = getCopy("nl");

/**
 * Global 404 (unmatched routes). Bypasses the [lang] layout, so it is a full document and bilingual:
 * Dutch first, English below, each block with its own lang attribute. Static and server-rendered.
 */
export const metadata: Metadata = {
  title: { absolute: `${nl.meta.notFoundTitle} · ${nl.siteName}` },
  robots: { index: false, follow: true },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#1A201D", width: "device-width", initialScale: 1 };

export default function GlobalNotFound() {
  return (
    <html lang="nl-NL" className={`${display.variable} ${text.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          {nl.a11y.skip}
        </a>
        <header className={styles.bar}>
          <div className={`container ${styles.inner}`}>
            <Lockup href={pathFor("home", "nl")} wordmark={nl.brand.wordmark} ariaLabel={nl.a11y.home} />
            <nav aria-label={nl.a11y.languageSwitch} className={styles.langs}>
              <a href={pathFor("home", "nl")} hrefLang="nl" lang="nl" className="t-ui">
                NL
              </a>
              <span aria-hidden="true" className={styles.sep} />
              <a href={pathFor("home", "en")} hrefLang="en" lang="en" className="t-ui">
                EN
              </a>
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1} className={styles.main}>
          <NotFoundView lang="nl" headingLevel="h1" />
          <div className={styles.divider} aria-hidden="true" />
          <NotFoundView lang="en" headingLevel="h2" />
        </main>
        <Footer lang="nl" />
      </body>
    </html>
  );
}
