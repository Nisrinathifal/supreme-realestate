/**
 * Screenshots of every page at 390px and 1440px, NL and EN, with and without prefers-reduced-motion.
 * Also asserts: no horizontal scroll, one h1, correct <html lang>, hreflang present.
 * Output: test-results/screenshots/<page>-<lang>-<width>-<motion>.png
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const pages: { key: string; nl: string; en: string }[] = [
  { key: "home", nl: "/", en: "/en" },
  { key: "about", nl: "/over-ons", en: "/en/about" },
  { key: "contact", nl: "/contact", en: "/en/contact" },
  { key: "privacy", nl: "/privacy", en: "/en/privacy" },
  { key: "cookies", nl: "/cookies", en: "/en/cookies" },
  { key: "disclaimer", nl: "/disclaimer", en: "/en/disclaimer" },
  { key: "colophon", nl: "/colofon", en: "/en/colophon" },
  { key: "404", nl: "/bestaat-niet", en: "/en/does-not-exist" },
];
const widths = [390, 1440] as const;
const motions = ["no-preference", "reduce"] as const;
const dir = "test-results/screenshots";
mkdirSync(dir, { recursive: true });

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // Scroll through so lazy content and scroll-triggered motion reach final state, then return to top.
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

for (const p of pages) {
  for (const lang of ["nl", "en"] as const) {
    for (const width of widths) {
      for (const motion of motions) {
        test(`${p.key} ${lang} ${width} ${motion}`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width, height: width < 768 ? 844 : 900 },
            reducedMotion: motion,
            deviceScaleFactor: 1,
          });
          const page = await context.newPage();
          const res = await page.goto(p[lang]);
          expect(res?.status()).toBe(p.key === "404" ? 404 : 200);
          await settle(page);

          const htmlLang = await page.getAttribute("html", "lang");
          // The global 404 is one bilingual document (NL first), so it always declares nl.
          expect(htmlLang?.startsWith(p.key === "404" ? "nl" : lang)).toBeTruthy();
          expect(await page.locator("h1").count()).toBe(1);

          const [scrollW, clientW] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
          expect(scrollW, "horizontal scroll").toBeLessThanOrEqual(clientW);

          if (p.key !== "404") {
            expect(await page.locator('link[rel="alternate"][hreflang="nl"]').count()).toBe(1);
            expect(await page.locator('link[rel="alternate"][hreflang="en"]').count()).toBe(1);
            expect(await page.locator('link[rel="alternate"][hreflang="x-default"]').count()).toBe(1);
          }

          await page.screenshot({ path: `${dir}/${p.key}-${lang}-${width}-${motion}.png`, fullPage: true });
          await context.close();
        });
      }
    }
  }
}
