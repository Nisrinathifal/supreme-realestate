# Supreme Real Estate website

Bilingual brand site (NL default, EN) that makes Supreme Real Estate look like a solid, verifiable company without disclosing what it owns.

## Docs (read first)
- `PRD.md` — scope, pages, disclosure policy (§6), company data (§7), due diligence, acceptance.
- `DESIGN-opsi1.md` — chosen direction "Daylight": tokens (§3), components (§9), pages (§10), motion (§11), checklist (§16).
- `REFERENCE-MOTION.md` — GSAP/ScrollTrigger/Lenis patterns; apply §9 (calm, no tilt, no chips, no map, no float, no pop).
- Precedence: PRD disclosure rules > DESIGN > REFERENCE-MOTION.

**Read `DESIGN-opsi1.md` before any UI change; read `PRD.md` §6 before adding any image or text.**

## Stack
Next.js 16 (App Router, TypeScript, static generation), CSS Modules + CSS custom properties (`styles/tokens.css`), `gsap` + `@gsap/react` + `lenis`, `@phosphor-icons/react` (Light), `next/font` (Funnel Display, Inter Tight), `sharp` media pipeline, Playwright, Lighthouse.

## Commands
- `npm run dev` — dev server
- `npm run build` — runs `check:filenames`, then `next build` (must pass with no type errors)
- `npm run lint` / `npm run typecheck`
- `npm run test` — Playwright (`npm run screenshots` = every page × NL/EN × 390/1440 × reduced-motion on/off → `test-results/screenshots/`)
- `npm run lighthouse` — mobile Lighthouse on home (needs `npx next start -p 3100`)
- `npm run media` — build AVIF/WebP/JPEG from `media/src/`, strip metadata
- `npm run check:placeholders` — lists remaining drafts/placeholders; fails a production build unless `ALLOW_PLACEHOLDERS=1`

## Structure
```
app/[lang]/            root layout (html lang, header, footer, JSON-LD), home, [...slug] (translated slugs)
app/global-not-found   static bilingual 404 for unmatched routes (experimental.globalNotFound)
app/api/contact/       form route (mail adapter, honeypot, rate limit, no storage)
content/               company.json (+ company.ts helpers), copy.nl.ts / copy.en.ts, routes.ts, media.ts, legal/*.md
components/brand|ui|layout|sections|pages|motion
lib/                   seo, jsonld, i18n, site, mail
styles/                tokens.css (DESIGN §3, single source of truth), base.css
scripts/               media, icons, check-filenames, check-placeholders, lighthouse (.mts)
tests/                 Playwright specs
media/src/ (gitignored originals) → public/media/ (pipeline output only)
```
Routing: NL at `/`, EN at `/en`; `next.config` rewrites root paths into `/nl/*` and redirects `/nl/*` → `/*`. Unknown slugs are unmatched routes (`dynamicParams = false`) so the static global 404 is served.

## Hard rules
1. Never invent content: no company details, copy, numbers, facts, people, addresses beyond the docs. Copy not verbatim from the docs is wrapped in `draft()`. Empty company fields hide their row; never render `[ ]`.
2. Disclosure (PRD §6): no properties, addresses, prices, portfolio size, tenants, operations — also not in file names, alt text, metadata or sitemap. Media file names neutral (`detail-stair-01`).
3. Tokens only: every colour, font, radius and spacing comes from `styles/tokens.css`. No hard-coded values in components.
4. Readable without JS and with reduced motion. Animation start states in JS (`gsap.set`), never `opacity: 0` in CSS. Reduced motion: no Lenis, no pins, no scrub, hero shows poster.
5. Bilingual: every page in NL and EN, translated slugs from `content/routes.ts`, correct `lang` and `hreflang`.
6. WCAG 2.2 AA: keyboard access, visible focus, film pause control, contrast pairs from DESIGN §3.2. Lime never as text/icon/line on light.
7. One `primary` button, one roof frame and one "lijn" per view. Titles always say "Supreme Real Estate", never "Supreme" alone; never box the wordmark.
8. Commit per milestone. Do not add dependencies without asking. `next.config` sets `agentRules: false`; do not let `next dev` overwrite this file.
