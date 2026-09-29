# PRD — Supreme Real Estate website (v1)

| | |
|---|---|
| Status | Draft for review |
| Owner | Mitchell Kasiman |
| Design spec | `DESIGN-opsi1.md` or `DESIGN-opsi3.md` (one is chosen; see §12) |
| Languages | Dutch (primary), English |
| Last updated | 2026-09-29 |

Items marked **[Assumption]** are defaults chosen to keep the build moving; confirm or change them. Items marked **[Decision]** are open and listed in §14.

---

## 1. Summary

Supreme Real Estate is a real-estate company in Amsterdam focused on existing residential property and the long term. The company has been rebranded; the website is the first public expression of the new brand.

**The website's job is to make Supreme look like a solid, established entity**, so that when third parties investigate the company (sellers, brokers, notaries, banks, advisors, counterparties, press), they find a professional, consistent and verifiable business.

It says: *"This is a serious company with substance."* It does **not** show what Supreme owns, where, or exactly how the business operates.

---

## 2. Goals and non-goals

### Goals
1. **Pass a background check.** Anyone looking into Supreme finds verified legal details, professional contact details, legal pages and consistent information (§8).
2. **Premium, future-facing brand.** Calm, precise, high quality; led by film, architecture, materials and light.
3. **Discretion by design.** No holdings, projects or operational detail on the public site.
4. **Easy, professional contact.** The right people can reach Supreme directly.

### Non-goals (v1)
- No portfolio, project pages, map or project captions.
- No listings, prices, search, sales or rental functionality.
- No figures: portfolio size, units, returns, growth, pipeline.
- No investor or tenant portal, login area, blog, newsletter, chat widget or job board.

### Success measures
Baselines do not exist yet; set targets after the first 8 weeks live.
- Due-diligence readiness checklist (§8) fully green at launch and re-checked quarterly.
- Qualified contact requests per month, by subject.
- Core Web Vitals within targets on mobile (LCP < 2.5s, CLS < 0.1, INP < 200ms).
- Zero disclosure incidents.

---

## 3. Audiences

| Audience | What they look for | What the site gives them |
|---|---|---|
| Third parties doing a check (sellers, brokers, notaries, banks, advisors, counterparties) | Is this a real, registered, reachable, professional company? | Company details matching the KvK, office address, phone, company e-mail domain, legal pages, consistent branding |
| Professional partners (architects, contractors) | Quality level and seriousness | Atmosphere, principles, direct contact |
| Press | Who Supreme is and how to reach it | About page, contact |
| Current residents | How to reach the company | Contact details (no portal) |

---

## 4. Principles

1. **Professional and institutional**: calm, precise, high quality, no hype.
2. **Selective disclosure**: no portfolio grid or holdings; not exactly what we do and have.
3. **Credible, never vague**: verified legal details, professional contact details, privacy/legal pages, clear company information.
4. **No portfolio on the website**: portfolio material is handled separately by Supreme (out of scope).
5. **Led by atmosphere**: hero film, architectural details, materials, light and space, quiet moments, minimal captions.
6. **Almost futuristic**: future-facing through precision, light and depth.

---

## 5. Scope v1

### 5.1 Sitemap

A deliberately small site. Fewer pages, each complete and verified, reads as more institutional than many thin pages.

| Route (NL / EN) | Page | Priority |
|---|---|---|
| `/` · `/en/` | Home | Must |
| `/over-ons` · `/en/about` | Over ons / About (story, principles, company details) | Must |
| `/contact` · `/en/contact` | Contact (details + form) | Must |
| `/privacy` · `/en/privacy` | Privacybeleid | Must |
| `/cookies` · `/en/cookies` | Cookiebeleid | Must (content depends on §9.5) |
| `/disclaimer` · `/en/disclaimer` | Disclaimer | Must |
| `/colofon` · `/en/colophon` | Colofon (full company details, credits) | Must |
| `404` | Not found | Must |

Navigation shows only: Over ons, Contact, NL/EN. Layouts are in the DESIGN file §10.

### 5.2 Features

| # | Feature | Priority | Notes |
|---|---|---|---|
| F1 | Bilingual NL/EN with toggle, `hreflang`, translated slugs | Must | NL default and `x-default`. |
| F2 | Hero film with poster, pause control, reduced-motion fallback | Must | Film supplied by the client (§10). |
| F3 | Homepage sections per DESIGN §10.1 | Must | Includes Bedrijfsgegevens section. |
| F4 | Company details from one config, reused everywhere + schema.org | Must | §7. |
| F5 | Contact form with subject routing and spam protection | Must | §9.2. |
| F6 | Legal pages | Must | Texts from legal (§10). |
| F7 | SEO: metadata, OG images, sitemap, robots, `Organization` schema | Must | |
| F8 | Image and film pipeline with metadata stripping | Must | §6.2. |
| F9 | Security headers and hardening | Must | §9.6. |
| F10 | Privacy-friendly analytics, or none | Should | §9.5. |

---

## 6. Disclosure policy

### 6.1 What the public site may say
Supreme is a real-estate company in Amsterdam; it focuses on existing homes and the long term; its principles (Zorgvuldig, Blijvend, Lange termijn); its brand promise (Van oud naar waardevol); verified company details; how to get in touch. **Nothing more specific.**

### 6.2 What it must never show, and the safeguards
Never: which properties Supreme owns, manages or has worked on; addresses, house numbers, postcodes or neighbourhoods tied to a property; prices, valuations, rents, yields, financing, lenders, investors; portfolio size, units, square metres, pipeline; tenants or recognisable residents; operational detail (sourcing, deal structure, margins, named suppliers).

Safeguards:
- Imagery is atmosphere, not evidence: details, materials, light, spaces that cannot be traced to an address. House numbers, street signs and number plates blurred or cropped.
- Build-time pipeline strips EXIF/GPS from all images and posters (e.g. `sharp`, which drops metadata unless told to keep it; verify in the chosen setup). Film is re-encoded without metadata.
- Neutral media file names; a build check fails on file names that look like addresses **[Assumption: simple pattern list in the repo]**.
- No captions on public pages.
- Pre-launch and quarterly disclosure audit (§13).

### 6.3 Portfolio
Out of scope for this build. Supreme handles portfolio material separately.

---

## 7. Company information

All values live in one file (`content/company.json`) and render on the homepage (Bedrijfsgegevens), Over ons, Contact, Colofon, footer and schema.org. An empty field hides its row; placeholders never appear on the live site. Values must match the KvK registration **exactly** (spelling, legal form, address).

| Field | Value | Status |
|---|---|---|
| Statutaire naam (legal name) | Supreme Real Estate B.V. | To verify against KvK |
| Handelsnaam (trade name) | [ ] | Verify |
| KvK-nummer | [ ] | Needed |
| Vestigingsadres (visiting address) | [ ] | Needed (a real office, not only a PO box) |
| Postadres (if different) | [ ] | Optional |
| BTW-nummer (VAT) | [ ] | Recommended |
| E-mail (general) | [ ]@[company domain] | Needed; company domain, never a free mail address |
| E-mail (legal / compliance) | [ ]@[company domain] | Recommended **[Decision]** |
| Telefoon | [ ] | Needed; answered during office hours |
| Bereikbaar (availability) | [ ] | Optional |
| Bestuur (management names and roles) | [ ] | **[Decision]**: shown or not |
| LinkedIn company page | [ ] | Recommended |

Branding: Supreme is presented as a standalone brand; the parent group is not shown **[Assumption, from the brand decision]**. If a legal reference to the group is required (e.g. in the colofon), confirm the wording with legal.

---

## 8. Due-diligence readiness

What a third party typically checks, and what must be true at launch. Items outside the website are included because they are checked together with it.

**On the website**
- [ ] Legal name, KvK number, visiting address and VAT number visible in the footer, on Over ons, Contact and Colofon, identical everywhere and identical to the KvK.
- [ ] Professional contact: company-domain e-mail, a phone number that is answered, a real office address.
- [ ] Privacy policy (AVG/GDPR), cookie policy, disclaimer and colofon published and dated.
- [ ] No placeholders, lorem ipsum, broken links, stock photos or AI renders.
- [ ] HTTPS everywhere, valid certificate, security headers (§9.6), no third-party trackers without consent.
- [ ] `Organization` structured data with legal name, KvK (`identifier`), VAT (`vatID`), address and contact point.
- [ ] Stable URLs; the site works without JavaScript for all essential information.

**Around the website** (owner: Supreme)
- [ ] Domain registered to the company; e-mail domain has SPF, DKIM and DMARC set up.
- [ ] LinkedIn company page with the same name, logo, address and description; key people's profiles consistent with it.
- [ ] Google Business Profile (if used) with the same name, address and phone.
- [ ] KvK registration, website and e-mail signatures use the same legal name, address and logo.
- [ ] Letterhead, e-mail signature and business cards match the new brand (brand guideline).

---

## 9. Functional requirements

### 9.1 Internationalisation
- NL default at `/`, EN under `/en/`, translated slugs. Every page exists in both languages at launch.
- The toggle keeps the visitor on the equivalent page. No automatic redirect by browser language.

### 9.2 Contact form
- Fields and states per DESIGN §9.11. Subjects: `samenwerking`, `pers`, `juridisch`, `overig`; `?onderwerp=` pre-selects.
- Delivery by e-mail to recipients per subject **[Decision: addresses]**, via a transactional e-mail provider with EU data processing **[Assumption]**.
- No storage of submissions on the website **[Assumption]**. A CRM can be integrated later.
- Spam: honeypot + server-side rate limiting; no image CAPTCHAs.
- Consent checkbox linking to the privacy policy; timestamp and consent included in the e-mail.
- Server-side validation mirrors the client; error messages per DESIGN §14.

### 9.3 SEO
- Unique title and description per page and language. Titles always include "Supreme Real Estate" (never "Supreme" alone).
- `sitemap.xml` with language alternates; `robots.txt`; drafts and previews excluded.
- Canonical URLs; no indexable duplicates.
- Search visibility is not a goal beyond brand-name searches; the site must rank for "Supreme Real Estate" and "Supreme Real Estate Amsterdam".

### 9.4 Performance and quality
- LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile 4G; the hero poster is the LCP element.
- Minimal JavaScript; CSS + IntersectionObserver for motion before any animation library **[Assumption]**.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best practices ≥ 95, SEO ≥ 95.

### 9.5 Privacy, cookies, analytics
- Default: no tracking cookies. Cookieless, privacy-friendly analytics, or none at launch **[Decision]**.
- Whether a cookie banner is needed depends on the final tools; confirm with legal.
- Fonts self-hosted; no third-party embeds (maps, YouTube, social widgets).

### 9.6 Security
- HTTPS only with HSTS; strict Content Security Policy; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` denying camera, microphone, geolocation; `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`).
- Form endpoint: rate limit, input size limits, no reflection of input.

### 9.7 Accessibility
- WCAG 2.2 AA per DESIGN §13 (film pause control, keyboard access, reduced motion).

---

## 10. Content requirements

| Content | Owner | Status |
|---|---|---|
| Final NL copy (home, over ons, contact) | Supreme | Draft in DESIGN file; native review needed |
| English copy | Supreme | Draft in DESIGN file; review needed |
| Company description, 2–3 sentences, verified | Supreme | Needed |
| Company details (§7) | Supreme | Needed |
| Hero film, 12–20s loop, + poster | Film maker | Brief in DESIGN §12; must pass §6.2 |
| Photography: 12–20 detail, interior and exterior images | Photographer | Licensed, untraceable, metadata stripped |
| Management portraits (if D5 = yes) | Photographer | Professional, consistent |
| Legal texts: privacy, cookies, disclaimer, colofon | Legal | Launch blocker |
| Final logo files (SVG) and wordmark | Designer | Wordmark still typeset |
| Photo and film credits | Supreme | For colofon |

Until final assets arrive the build uses clearly marked placeholders; an automated pre-launch check fails if any remain.

---

## 11. Technical approach

**[Assumption: to be confirmed by the lead developer]**
- Next.js (App Router, TypeScript), all public pages statically generated.
- Styling from the DESIGN tokens (CSS custom properties) with Tailwind or CSS Modules.
- Content in typed JSON/MDX files in the repo (copy, company details). No CMS in v1: content changes are rare and controlled **[Decision]**.
- Images optimised at build time; film served as static MP4/WebM from the CDN (no third-party player with branding or tracking).
- Hosting with EU region and edge CDN **[Decision: provider]**.
- Form: serverless function + EU transactional e-mail provider.
- Repo contains `CLAUDE.md`, `PRD.md`, the chosen `DESIGN-*.md`, and `content/`.

---

## 12. Design direction

Two directions are specified in full, each with its own colour logic, typography, material feel and mood:
- `DESIGN-opsi1.md` **Daylight**: light-first, Dak-S mark, lime as a signal light, Funnel Display; a calm gallery in daylight.
- `DESIGN-opsi3.md` **Deep canal**: dark-first, layered S mark, Fresh green as a signal light, Bricolage Grotesque; Amsterdam at blue hour.

Selection criterion (from management): the direction that feels **most distinct, premium and future-facing**. Both share the same structure and content, so the choice does not change scope. Build only the chosen direction; if both must be shown live for the decision, use separate branches or preview deployments.

---

## 13. Milestones

| Milestone | Scope | Exit criteria |
|---|---|---|
| M0 Decisions | Direction, stack/hosting, analytics, recipients, management shown | Recorded in §14 |
| M1 Foundation | Repo, tokens, fonts, layout, header/footer, i18n, company config | Pages render NL/EN with placeholders |
| M2 Homepage | All sections, film player, motion, reduced motion | DESIGN checklist passes for home |
| M3 Pages | Over ons, Contact + form, legal template, 404 | Form delivers in staging |
| M4 Content | Copy, film, photos, legal texts, verified company details | No placeholders (automated check) |
| M5 QA and launch | Accessibility, performance, SEO, security, disclosure audit, due-diligence checklist | §15 met |

Dates follow once M0 is done.

---

## 14. Open decisions

| # | Decision | Options | Owner |
|---|---|---|---|
| D1 | Design direction | Daylight (opt 1) / Deep canal (opt 3) | Management |
| D2 | Stack and hosting | Next.js on EU-region host (default) / other | Lead developer |
| D3 | Content editing | Files in repo (default) / headless CMS | Management + dev |
| D4 | Analytics | None / cookieless tool | Management + legal |
| D5 | Show management names and roles | Yes / no | Management |
| D6 | Form recipients per subject, and a legal/compliance address | [ ] | Management |
| D7 | Group relationship mentioned anywhere (e.g. colofon) | Yes / no, wording | Management + legal |
| D8 | Domain and e-mail domain | [ ] | Management |

---

## 15. Acceptance criteria (launch)

- [ ] All Must pages exist in NL and EN.
- [ ] Disclosure audit passed: no property, address, figure, project name or tenant detail in pages, images, file names, EXIF, alt text, metadata or sitemaps.
- [ ] Due-diligence checklist (§8) green, including items around the website.
- [ ] Company details complete, verified, identical to the KvK and consistent everywhere.
- [ ] Legal pages published with texts from legal.
- [ ] Contact form delivers to the right recipients; spam protection active; consent recorded.
- [ ] Performance, accessibility and SEO targets met on mobile.
- [ ] Security headers verified.
- [ ] Acceptance checklist of the chosen DESIGN file (§16) passes.

---

## 16. Risks

| Risk | Mitigation |
|---|---|
| A photo or film shot reveals a property (house number, distinctive facade, metadata) | Selection rules, blurring, metadata stripping, file-name check, disclosure audit |
| Site looks "too empty" and therefore less credible | Strong film and photography, complete verified company details, polished legal pages; quality over quantity |
| Inconsistent company details across KvK, website, LinkedIn, e-mail | Single config for the site; §8 checklist for everything around it |
| Film or photos not ready at launch | Launch with a still hero and fewer images; the layout supports it |
| Legal texts late | Launch blocker; start early |
| Name confusion with the streetwear brand "Supreme" | Always "Supreme Real Estate" in titles and metadata; never box the wordmark; BOIP trademark check |
| Dutch copy quality | Native review before launch |
