/**
 * Lighthouse (mobile) on the homepage. Expects a production server at LH_URL (default http://localhost:3100).
 * Uses Playwright's Chromium so no separate Chrome install is needed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const url = process.env.LH_URL ?? "http://localhost:3100/";
const chromePath = process.env.CHROME_PATH ?? execSync("node -e \"console.log(require('playwright').chromium.executablePath())\"").toString().trim();

const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ["--headless=new", "--no-sandbox"] });
try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: "html",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
  });
  if (!result) throw new Error("no result");
  mkdirSync("lighthouse", { recursive: true });
  writeFileSync("lighthouse/home-mobile.html", result.report as string);
  const cats = result.lhr.categories;
  const line = Object.values(cats)
    .map((c) => `${c.title}: ${Math.round((c.score ?? 0) * 100)}`)
    .join(" · ");
  console.log(line);
  const audits = result.lhr.audits;
  console.log(`LCP ${audits["largest-contentful-paint"].displayValue} · CLS ${audits["cumulative-layout-shift"].displayValue} · TBT ${audits["total-blocking-time"].displayValue}`);
  const lcpEl = audits["largest-contentful-paint-element"]?.details as { items?: { items?: { node?: { snippet?: string }; phase?: string; timing?: number }[] }[] } | undefined;
  const lcpItems = lcpEl?.items ?? [];
  const node = lcpItems[0]?.items?.[0]?.node?.snippet;
  if (node) console.log(`LCP element: ${node.slice(0, 120)}`);
  for (const ph of lcpItems[1]?.items ?? []) console.log(`  ${ph.phase}: ${Math.round(ph.timing ?? 0)} ms`);
  writeFileSync("lighthouse/home-mobile.json", JSON.stringify(result.lhr, null, 1));
  const failing = Object.values(audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === "binary");
  for (const a of failing) console.log(`  ! ${a.id}: ${a.title}`);
} finally {
  await chrome.kill();
}
