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
const motions = ["no-preference", "reduce", "nojs"] as const;
const dir = "test-results/screenshots";
mkdirSync(dir, { recursive: true });

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // Real wheel events (Lenis intercepts wheel) down to the bottom and back, so once-only motion reaches
  // its final state and scrubbed motion returns to its top state.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.mouse.move(100, 300);
  const steps = Math.ceil(h / 300) + 2;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(800);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(800);
}

for (const p of pages) {
  for (const lang of ["nl", "en"] as const) {
    for (const width of widths) {
      for (const motion of motions) {
        // The no-JS variant only runs for the homepage (the page with motion) to keep the suite short.
        if (motion === "nojs" && p.key !== "home") continue;
        test(`${p.key} ${lang} ${width} ${motion}`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width, height: width < 768 ? 844 : 900 },
            reducedMotion: motion === "nojs" ? "no-preference" : motion,
            javaScriptEnabled: motion !== "nojs",
            deviceScaleFactor: 1,
          });
          const page = await context.newPage();
          const res = await page.goto(p[lang]);
          expect(res?.status()).toBe(p.key === "404" ? 404 : 200);
          // Homepage intro (preloader) ends by flagging <html data-preloader-skip>; reduced motion flags it at once.
          if (p.key === "home" && motion !== "nojs") await page.waitForFunction(() => document.documentElement.hasAttribute("data-preloader-skip"), null, { timeout: 20000 });
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
