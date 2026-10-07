# DESIGN.md — Supreme Real Estate website · Option 1

This file describes **Option 1: Dak-S mark, lime palette, Funnel Display**. It is self-contained. A separate DESIGN file describes Option 3; do not mix tokens, logos or graphics between the two. Read `PRD.md` for scope, pages, company data and the disclosure policy.

---

## 0. How to use this file

- Tokens in §3 are the single source of truth. No hard-coded colours, font sizes or radii in components.
- Page structure and behaviour are in §10. Build in that order.
- Copy is Dutch first, English next to it. Do not invent copy, numbers, project facts or company details. Use the placeholders marked `[ ]`, and hide a field when its verified value is missing.
- **Disclosure rules (§2) override everything else in this file.** When in doubt, show less.
- The stack is the project's choice. Values are plain CSS so they map to Tailwind, CSS Modules or vanilla CSS. With Tailwind, map tokens in `theme.extend` to the CSS variables (`colors.ink: 'var(--ink)'` etc.).
- Check every page against the acceptance checklist in §16.

---

## 1. Direction

**Purpose.** Supreme must look like a **solid, established entity**, so that when third parties look into the company (sellers, brokers, notaries, banks, advisors, counterparties, press) they find a professional, consistent and verifiable business.

The website says: **"This is a serious company with substance."**
Not: "Here is everything we own and every detail of what we do."

- **Professional and institutional.** Calm, precise, high quality, no hype.
- **Credible, never vague.** Verified legal details, professional contact details, privacy and legal pages, clear company information.
- **Discreet about activity and holdings.** The site does not show what Supreme owns, where, or exactly how it operates.
- **No portfolio on the public site.** Portfolio material is handled separately by Supreme and is not part of this build.
- **Led by atmosphere.** A strong hero film; architectural details, materials, light and space; selected exterior and interior images; quiet moments without descriptions; captions only where facts are approved (on the public site: effectively none).
- **Almost futuristic.** Future-facing through precision, light and depth, not through gimmicks.

Tagline (working): **Van oud naar waardevol** / *From old to valuable*. Tone: clear, warm, confident, honest; Dutch uses "je" on the website. No superlatives, no promised returns, no rankings, no unverifiable figures.

### 1.1 This option's direction: Daylight

| Direction at a glance | Daylight |
|---|---|
| Colour logic | Light-first. Paper page, Canal ink text, one inverse band. Supreme lime only as a signal light (≤ 2%). |
| Typography | Funnel Display 500, very large and quiet, against tiny precise micro labels in Inter Tight. |
| Material feel | Lime plaster, limestone, pale oak, matte paint, daylight on white walls. |
| Mood | A calm gallery in daylight: open, exact, bright. |
| Future-facing cue | Precision: hairline grid, white space, crisp edges, a high-key film. |
| Hero film | Morning daylight moving over walls and through windows. |
| Signature | The lit window (Dakvenster) as a signal; the roof frame. |

- **Colour logic: light-first.** Paper and Canal ink carry the site. The page is Paper; one inverse band (Canal ink) carries the Principes section, and the footer is dark too. Supreme lime is a **signal light**, not a colour field: the window in the logo, the active-nav dot, focus accents on dark, the tiny separator square. It stays under ~2% of any screen, like light through a window.
- **Typography.** Funnel Display 500, large and quiet, tight tracking; Inter Tight for text and micro labels. The contrast between very large display type and very small precise labels is the signature.
- **Material feel.** Lime plaster, limestone, pale oak, matte paint, daylight on white walls. Surfaces are matte and flat; glass only where it floats over film.
- **Mood.** A calm gallery or an architectural model under daylight: open, exact, bright.
- **Future-facing through precision.** Hairline grid, generous white space, crisp edges, a very high-key daylight film.

---

## 2. Disclosure rules

These rules apply to every page, image, caption, file and piece of metadata.

**The public site never shows**
- Which properties Supreme owns, manages or has worked on beyond the four featured projects of PRD §6.1 (owner decision 2026-10-05): no portfolio grid, no map.
- Addresses, house numbers, postcodes, neighbourhoods tied to a property.
- Prices, valuations, rents, yields, returns, financing, lenders, investors.
- Portfolio size, number of units, square metres, growth figures, pipeline.
- Tenants, residents, or people recognisable without a signed release.
- How the business operates in detail: sourcing criteria, deal structure, margins, suppliers or contractors by name.

**What the public site does say** (and no more): Supreme is a real-estate company in Amsterdam focused on existing residential property and the long term; its principles (§10.1, section 3); verified company details; how to get in touch.

**Images and film are atmosphere, not evidence**
- Use details, materials, light, interiors and exteriors that cannot be traced to a specific address.
- Blur or crop house numbers, street signs, number plates. Avoid wide shots of distinctive facades and street corners.
- Strip EXIF/GPS metadata from every image and video. File names are neutral (`detail-stair-01.webp`).
- No captions on the public site, except the neutral film caption (`Amsterdam`) if wanted.

---

## 3. Design tokens

### 3.1 Colour tokens

```css
:root {
  /* base: light */
  --bg:            #FAFAF7; /* Paper */
  --surface:       #FFFFFF;
  --alt:           #EEEEE9; /* Stone: secondary panels */
  --line:          #E2E3DC;
  --ink:           #1A201D; /* Canal ink */
  --muted:         #5B625D; /* Graphite */
  --tint:          #EEF6DA; /* Lime mist: icon tiles, rare highlight panel */
  --accent:        #CFEA7C; /* Supreme lime: signal only, never text on light */
  --on-accent:     #1A201D;
  --btn-bg:        #1A201D;
  --btn-fg:        #FAFAF7;
  --focus:         #1A201D;
  --reveal-from:   #858C87;
  --grid-line:     rgba(26,32,29,.07);

  /* over film */
  --on-media:      #FAFAF7;
  --media-scrim:   linear-gradient(0deg, rgba(26,32,29,.62) 0%, rgba(26,32,29,.18) 45%, rgba(26,32,29,0) 70%);
  --glass:         rgba(250,250,247,.74);
  --glass-fg:      #1A201D;
  --glass-line:    rgba(255,255,255,.6);

  /* inverse band: Canal ink */
  --inv-bg:        #1A201D;
  --inv-surface:   #2C3833;
  --inv-ink:       #FAFAF7;
  --inv-muted:     #A7B4A2; /* Sage */
  --inv-line:      rgba(250,250,247,.14);
  --inv-grid-line: rgba(250,250,247,.06);
  --inv-btn-bg:    #FAFAF7;
  --inv-btn-fg:    #1A201D;
  --inv-focus:     #CFEA7C;
}
```

**Inverse bands.** Some sections flip to the other end of the palette. Components never check which band they are in; the band remaps the tokens:

```css
.inverse {
  --bg: var(--inv-bg);   --surface: var(--inv-surface); --ink: var(--inv-ink);
  --muted: var(--inv-muted); --line: var(--inv-line);   --grid-line: var(--inv-grid-line);
  --btn-bg: var(--inv-btn-bg); --btn-fg: var(--inv-btn-fg); --focus: var(--inv-focus);
  background: var(--bg); color: var(--ink);
}
```

**Supreme navy & cyan (owner, 2026-10-07).** The projects band after the night hero and its cards take the existing
logo's colours instead of Canal ink, so the night sky's blue carries on and the band is not green: `--night` #101C28
(Supreme navy, band and dark cards), `--night-surface` #1C2C3E, `--night-muted` #9FB0C3 (quiet text on navy, 7.8:1),
`--brand-cyan` #00989C (Supreme cyan: marks and lines only), `--cyan-light` #1AA9AD (small text on navy, 6.0:1 / 5.0:1
on night-surface), `--cyan-deep` #00767A (small text on light, 4.7:1 on sky mist and cyan mist), `--cyan-mist` #DFF1F1
(light card). Cyan is a touch, not a field: the band's label, each card's project line and index.

### 3.2 Colour rules (contrast checked, WCAG 2.x formula)

| Pair | Ratio | Use |
|---|---|---|
| Canal ink on Paper | 15.8:1 | all text |
| Graphite on Paper | 6.0:1 | secondary text |
| Paper on Canal ink | 15.8:1 | text in inverse band |
| Sage on Canal ink | 7.6:1 | secondary text in inverse band |
| Lime on Canal ink | 12.4:1 | signal (dot, focus ring, window) on dark |
| Canal ink on Lime | 12.4:1 | if text ever sits on a lime fill |
| Statement grey `#858C87` on Paper | 3.3:1 | only the large statement (≥ 30px) before it reveals |
| **Lime on Paper** | **1.3:1** | **never** as text, icon, line or logo colour on light |

- Lime share ≤ ~2% of any screen. On light backgrounds lime only appears as a small fill with an ink outline (the separator square) or inside a dark element.
- Text on Lime mist and Stone panels is always Canal ink.

- Semantic colours: form error text `#B3261E` on Paper (6.3:1); success uses `--ink` with a check icon. Never use the accent for status.

### 3.3 Typography tokens

```css
:root {
  --font-display: 'Funnel Display', 'Helvetica Neue', Arial, sans-serif;
  --display-weight: 500;
  --display-tracking: -0.03em;
  --font-text: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
}
```

Fonts (self-host in production via `next/font` or `@fontsource`): `Funnel Display` 400, 500; `Inter Tight` 400, 500, 600.

### 3.4 Shape, depth, spacing

```css
:root {
  --r-xl: 32px;   /* hero frame, bands, large media */
  --r-lg: 24px;   /* media tiles, cards */
  --r-md: 18px;   /* glass panels */
  --r-sm: 12px;   /* icon tiles, inputs */
  --r-pill: 999px;/* buttons, chips */

  --shadow: 0 30px 60px -30px rgba(10,20,20,.45); /* floating glass only */
  --blur: 18px;

  --frame: 12px;                     /* inset of framed media and bands */
  --gutter: clamp(20px, 4vw, 64px);
  --maxw: 1360px;
  --section-y: clamp(96px, 12vw, 176px);

  --ease: cubic-bezier(.2,.7,.2,1);
  --ease-precise: cubic-bezier(.65,0,.35,1);
}
```

Spacing scale (4-pt base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 176.
Radius is deliberately tighter than a consumer site: calm and precise, not bubbly. Flat surfaces have no shadow; only glass that floats over media gets `--shadow`.

---

## 4. Typography scale (responsive)

Fluid between 390px and 1440px viewports.

| Role | Font | Size | Line height | Tracking | Notes |
|---|---|---|---|---|---|
| Display (hero) | display | `clamp(48px, 8vw, 128px)` | 0.92 | display tracking | one per page |
| H2 | display | `clamp(40px, 5.2vw, 80px)` | 1.0 | display tracking | section titles |
| Statement | display | `clamp(30px, 3.8vw, 56px)` | 1.16 | -0.02em | scroll reveal, max 1100px |
| H3 | display | `clamp(24px, 2.2vw, 32px)` | 1.15 | -0.01em | principles, cards |
| Lead | text 400 | 19px | 1.5 | 0 | hero line, section intros, max 46ch |
| Body | text 400 | 17px (min 16px) | 1.6 | 0 | max 65ch |
| UI | text 500 | 15px | 1 | 0.01em | buttons, nav |
| Micro label | text 500 | 12px | 1.3 | 0.18em, uppercase, tabular | index labels, legal keys |
| Legal | text 400 | 14–16px | 1.5 | 0 | company details, footer |

- Headings use `text-wrap: balance`; sentence case. All caps only for the wordmark and micro labels.
- Numbers use `font-variant-numeric: tabular-nums`.

---

## 5. Layout, grid and future-facing details

- Content column `max-width: var(--maxw)`, `padding-inline: var(--gutter)`; 12 columns, gap 24px (16px mobile).
- Breakpoints: `≤560px` phone, `≤980px` tablet, `≥1440px` wide.
- Imagery may be asymmetric (7/5, 8/4, offset tiles); text always aligns to the grid.
- No horizontal page scroll at any width.

**Future-facing details** (used with restraint; these make the site feel "almost futuristic"):
- **Hairline grid.** The 12 column guides as 1px lines in `--grid-line`, in the hero and inverse bands. They draw in once (§11), then stay still.
- **Index labels.** Every section opens with a micro label: `01 — Supreme`, `02 — Principes`… Tabular, uppercase, `--muted`.
- **City coordinates.** One micro label in the hero: `52.37° N · 4.90° E — Amsterdam` (the city, never a property).
- **Precise glass.** Glass panels have a 1px `--glass-line` border and a faint top highlight (`linear-gradient(180deg, rgba(255,255,255,.18), transparent 40%)`).
- **Light as material.** Daylight: a very soft warm-white radial light (`radial-gradient(60% 50% at 20% 0%, rgba(255,255,255,.7), transparent)`) at the top of light sections, as if from a window. Barely visible; never a coloured gradient.
- **Avoid:** neon, particle backgrounds, 3D objects, cursor trails, glitch effects, auto-rotating carousels, stock "tech" gradients, counters and statistics.

---

## 6. Logo on the web

### Mark: Dak-S (the roof, one continuous S line, and the window of light)

```html
<svg viewBox="0 0 100 100" aria-label="Supreme" role="img">
  <path d="M82,50 V40 L50,12 L18,40 V60 H82 V92 H18 V80"
        fill="none" stroke="currentColor" stroke-width="11" stroke-linejoin="round"/>
  <rect x="45" y="33" width="10" height="10" rx="1.5" fill="var(--win, currentColor)"/>
</svg>
```
- On light: stroke and window `--ink`.
- On dark or over film: stroke `--inv-ink`, window lime (`--win: var(--accent)`). The window turns lime only on dark.

### Lockup and rules
- Header lockup: mark 30–32px + wordmark `SUPREME` in the display font, 17px, `letter-spacing: .32em`, gap 12px.
- Clear space: X on every side, where X is the roof height of the mark. Minimum 24px on screen (8mm in print); smaller → mark alone.
- Colour: Canal ink on light, Paper on dark; never lime on light.
- Descriptor `REAL ESTATE` (Inter Tight 500, 11px, tracking .5em, `--muted`): footer, legal contexts and the OG image.
- The wordmark is currently typeset. Replace with the final vector wordmark when drawn; keep the component API the same.
- **Never put the wordmark in a filled box or rectangle** (avoids confusion with the streetwear brand of the same name). Page titles and metadata always say "Supreme Real Estate", never "Supreme" alone.

### Favicon and app icons
- `favicon.svg` and 32×32 PNG: mark in Paper with lime window on a Canal ink tile (radius 22%).
- `apple-touch-icon.png` 180×180, `icon-512.png` 512×512, same design.
- `theme-color`: `#1A201D`.

---

## 7. Iconography

- **Phosphor Icons, Light weight** (MIT): `@phosphor-icons/react` or `@phosphor-icons/web`. One set only.
- Size 20px in UI, 24px in tiles. Colour `currentColor`. Icons are sparse; text and imagery lead.
- **Plain icon**: next to text (buttons, links, contact details, forms).
- **Tile icon**: 44px square, radius `--r-sm`. Light: bg `--tint`, icon `--ink`. In the inverse band: bg `--inv-surface`, icon `--inv-ink`. Used only to head a principle or a contact method.
- Used icons: `ArrowRight`, `ArrowUpRight` (external), `Play`, `Pause`, `List`, `X`, `Compass` (zorgvuldig), `Stack` (blijvend), `Hourglass` (lange termijn), `EnvelopeSimple`, `Phone`, `Buildings` (office), `LinkedinLogo`.

---

## 8. Brand graphics

Borrowed from the Dak-S mark: the roof becomes a frame, the line a guide, the window a signal.

- **Dakvenster (window).** The small square from the mark as the site's signal: active-nav indicator (6px, lime, below the active link on dark; ink outline on light), list bullet, separator in micro labels (`01 ▪ Supreme`). Never larger than 14px.
- **Roof frame.** One media frame per page may have a pitched top edge (roof angle ~40°, `clip-path: polygon(0 18%, 50% 0, 100% 18%, 100% 100%, 0 100%)`). Use it for the first image in the Details or Impressies section. Never on small tiles, never on video.
- **De lijn.** A 1px hairline that runs from a section's index label to its content, or connects "Voor" → "Na" on a before/after pair. One per view.
- **Gevelritme.** A row of narrow vertical rectangles (facade rhythm) as a subtle divider between light sections, colour `--line`, height 24px.
- Brand graphics never sit behind body text.

---

## 9. Components

Focus ring on every interactive element: `outline: 2px solid var(--focus); outline-offset: 3px`.

### 9.1 Button
- Pill, `padding: 14px 22px` (large `17px 26px`), UI 15px (large 16px), gap 10px, optional trailing `ArrowRight`.
- `primary`: bg `--btn-bg`, text `--btn-fg`. **One per view.**
- `secondary`: bg `--surface`, text `--ink`, 1px `--line` border.
- `glass`: bg `--glass`, `backdrop-filter: blur(var(--blur))`, 1px `--glass-line`, text `--glass-fg`. Only over media.
- `text link`: `--ink`, underline offset 4px, 1px; 2px on hover.
- Hover: the arrow shifts 3px right; no bouncing, no scale. 250ms `--ease`.
- Labels say what happens: "Neem contact op", "Over Supreme". Never "Klik hier" or "Ontdek meer" alone.

### 9.2 Micro label
- Text only (§4). Used for index labels, legal keys and the optional film caption. No chips with facts on the public site.

### 9.3 Media frame
- Radius `--r-lg` (`--r-xl` for hero and full-width media), `overflow: hidden`, `object-fit: cover`.
- Aspect ratios: 16:9 (wide), 4:5 (portrait detail), 1:1 (square detail), 21:9 (panoramic band).
- No captions on the public site.

### 9.4 Glass panel
- Radius `--r-md`, padding `24px 26px`, bg `--glass`, blur `var(--blur)` + `saturate(1.2)`, border 1px `--glass-line`, top highlight (§5), `--shadow`, text `--glass-fg`.
- Content: tile icon, H3, one or two sentences. No links inside.
- No rotation; panels align to the grid.

### 9.5 Principle
- Three columns (stacked on ≤980px), each: index `01`, tile icon, H3, two lines of body. Top hairline `--line`.

### 9.6 Image sequence
- 4–6 media frames in an asymmetric grid (desktop) or a horizontal snap-scroller (≤980px, `scroll-snap-type: x mandatory`, keyboard-scrollable, `1 / 6` counter as micro label).
- No captions.

### 9.7 Company details list
- Definition list (`<dl>`), two columns on desktop: key (micro label, `--muted`) and value (Legal, `--ink`), selectable text.
- Keys, in this order: `Statutaire naam`, `Handelsnaam`, `KvK-nummer`, `Vestigingsadres`, `BTW-nummer`, `E-mail`, `Telefoon`, `Bereikbaar`, and optionally `Bestuur` (PRD decision).
- A key is hidden entirely when its verified value is missing. All values come from one config (`company.json`), used everywhere: header contact, footer, Over ons, Contact, Colofon, schema.org.
- Optional line under the list: **Voor juridische of compliance-vragen: [e-mail]** / *For legal or compliance questions: [e-mail]*.

### 9.8 Navigation
- **Header**: logo lockup left; right: `Over ons`, `Contact`, and `NL / EN`. Nothing else. Links 15px; `--on-media` over the film, `--ink` elsewhere.
- **On scroll** (after 80px): glass bar (`--glass`, blur, 1px bottom `--glass-line`), height 64px, `top: env(safe-area-inset-top)`, 300ms.
- **Mobile (≤980px)**: `Menu` opens a full-screen sheet in `--bg`: links in the display font at 40px, index numbers as micro labels, and the company e-mail and phone at the bottom. Focus trapped, `Escape` closes, focus returns to the button.
- Current page: text `--ink` + a 6px Dakvenster square under the link (lime on dark / over film, ink outline on light).

### 9.9 Language toggle
- `NL / EN` as two text buttons with a hairline between; active `--ink`, inactive `--muted`; `aria-pressed`.
- Routes `/` and `/en/`; `lang` and `hreflang` per route. No auto-redirect by browser language.

### 9.10 Video player (hero)
- `<video autoplay muted loop playsinline preload="metadata" poster="…">` with WebM (VP9/AV1) and MP4 (H.264); 1080p max on desktop, 720p source for ≤980px.
- Loop 12–20s, no sound. Target ≤ 6MB desktop, ≤ 3MB mobile.
- **Pause/Play control** always visible (bottom-right, glass pill, icon + "Pauzeer video" / "Pause video"): the film moves for more than 5 seconds (WCAG 2.2.2).
- `prefers-reduced-motion: reduce` or Save-Data → poster only, with a Play button.
- Poster is a real frame of the film, AVIF/WebP, `fetchpriority="high"`.

### 9.11 Forms
- Label above (14px/500), input 52px high, radius `--r-sm`, 1px `--line`, bg `--surface`; errors below the field with an icon, linked via `aria-describedby`.
- Contact form: Naam, Organisatie (optioneel), E-mail, Telefoon (optioneel), Onderwerp (Samenwerking · Pers · Juridisch / compliance · Overig), Bericht, consent checkbox linking to the Privacybeleid.
- Spam protection without visual puzzles (honeypot + server-side rate limit).
- Success inline: "Bedankt. We nemen persoonlijk contact met je op." No promised response time unless the team confirms one.

### 9.12 Footer
- Footer is an inverse band (`.inverse`, Canal ink), framed (`--frame`, radius `--r-xl` on the top corners).
- Row 1: logo lockup with `REAL ESTATE`; contact (e-mail, phone, visiting address) from `company.json`.
- Row 2: large wordmark `SUPREME`, display font, `clamp(56px, 13vw, 200px)`, line-height .86, letter-spacing .06em, never boxed, clipped with `overflow: hidden`.
- Row 3 (hairline above): `Supreme Real Estate B.V. · KvK [ ] · BTW [ ] · [plaats]` and `© [year]`; links: Privacybeleid, Cookiebeleid, Disclaimer, Colofon; `LinkedinLogo` if a company page exists.
- The legal line is plain text (selectable, not an image) so it can be copied during a check.

---

## 10. Pages

### 10.1 Homepage

Order: **Hero → Statement → Principes → Materiaal, licht en ruimte → Impressies → Bedrijfsgegevens → Contact → Footer.**

**1. Hero (film)**
- Full-bleed video, `min-height: clamp(620px, 92vh, 980px)`; bottom scrim `--media-scrim`; header and copy in `--on-media`. The film is very high-key daylight (see §12), so the scrim is only needed at the bottom where the copy sits.
- Hairline grid over the film; micro label bottom-left: `52.37° N · 4.90° E — Amsterdam`.
- Copy bottom-left, max 760px:
  - Display: **Van oud naar waardevol** / *From old to valuable*
  - Lead: **Supreme Real Estate is een vastgoedonderneming in Amsterdam, gericht op bestaande woningen en de lange termijn.** / *Supreme Real Estate is a real-estate company in Amsterdam, focused on existing homes and the long term.*
  - Buttons: `primary` **Neem contact op** (`/contact`) / *Get in touch*; `glass` **Over Supreme** (`/over-ons`) / *About Supreme*.
- Film pause control bottom-right.
- Scroll: during the first ~40% of the viewport the full-bleed film insets to a framed panel (inset 0 → `--frame`, radius 0 → `--r-xl`). Reduced motion: framed from the start.

**2. Statement**
- Micro label `01 — Supreme`.
- Statement (scroll reveal, §11): **Wij zien wat een woning kan worden, en geven haar met zorg een nieuwe toekomst. Zorgvuldig gekozen, met vakmanschap vernieuwd, voor de lange termijn.** / *We see what a home can become, and give it a new future with care. Carefully chosen, renewed with craft, for the long term.*

**3. Principes** (inverse band: `.inverse` (Canal ink), framed with `--frame` and `--r-xl`)
- Micro label `02 — Principes`; H2 **Waar wij voor staan** / *What we stand for*.
- Media frame (21:9 still or short material loop) with three glass panels aligned on the grid over its lower half (desktop); on ≤980px media first, then three principles stacked.
- Principles (values, not process):
  1. **Zorgvuldig** — Wij kiezen met aandacht en werken met mensen die vakmanschap leveren. / *Careful — We choose with attention and work with people who deliver craftsmanship.*
  2. **Blijvend** — Wat wij vernieuwen, moet generaties meegaan. / *Lasting — What we renew should last for generations.*
  3. **Lange termijn** — Wij denken in decennia, niet in transacties. / *Long term — We think in decades, not in transactions.*

**4. Materiaal, licht en ruimte**
- Micro label `03 — Details`; H2 **Materiaal, licht en ruimte** / *Material, light and space*.
- Image sequence (§9.6), 5 frames: stair detail (4:5), light on plaster (16:9), door hardware (1:1), empty renewed room (16:9), texture of brick or stone (4:5). No captions.

**5. Impressies**
- No heading, no label: a quiet full-width moment. One 21:9 exterior or interior image (or a 6–8s silent loop), followed by two images in a 7/5 split. Light, airy sequence with generous Paper space around the images; the first image may use the roof frame (§8).
- Must not be identifiable as a specific property (§2). This is atmosphere, not a portfolio.

**6. Bedrijfsgegevens** (`#bedrijf`, light, on `--bg`, with a Gevelritme divider above)
- Micro label `04 — Bedrijf`; H2 **Bedrijfsgegevens** / *Company details*.
- Left: 2–3 sentences of verified company description (supplied by Supreme).
- Right: company details list (§9.7).
- This section is the proof for anyone checking the company. It shows real, verified details or it is hidden.

**7. Contact**
- Light section on `--bg`, left-aligned, with De lijn running from the index label `05 — Contact` to the heading.
- H2 **Neem contact op** / *Get in touch*; Body **Voor samenwerking, pers of andere vragen: we reageren persoonlijk.** / *For partnerships, press or other questions: we reply personally.*; `primary` button to `/contact`; e-mail and phone as text links next to it.

**8. Footer** — §9.12.

### 10.2 Other pages

- **/over-ons** (About): hero still (21:9); short company story (verified); the three principles; a line on the brand promise **Van oud naar waardevol**; company details list; optional management section (names, roles, professional portraits) only if decided in the PRD. No projects, no numbers.
- **/contact**: H1; contact methods (e-mail, phone, visiting address, availability) from `company.json`; form (§9.11). No map embed; if needed, a static map image of the office with a link out.
- **/privacy**, **/cookies**, **/disclaimer**, **/colofon**: document layout, max 70ch, H1 + H2s, "Laatst bijgewerkt: [datum]". Texts from legal; never generated. The colofon repeats the full company details and credits photography and film.
- **404**: Paper page, the roof frame as an empty outline (1px `--ink`), H1 **Deze pagina bestaat niet (meer)** / *This page does not exist (anymore)*, text link home.

---

## 11. Motion

Calm and precise. Everything is readable before any animation runs; never start content at `opacity: 0` waiting for JavaScript.

| Effect | Spec |
|---|---|
| Hero inset | Scroll-linked, first ~40% of viewport height: inset 0 → `--frame`, radius 0 → `--r-xl`. |
| Hairline draw | Grid lines scale 0 → 1 on first view, 900ms `--ease-precise`, staggered 40ms. Once only. |
| Statement reveal | Words go from `--reveal-from` to `--ink` with scroll: `p = clamp((0.9·vh − top) / (height + 0.45·vh), 0, 1)`, first `round(p·words)` active; colour transition 350ms. |
| Mask reveal | Media below the fold start at `clip-path: inset(6% round var(--r-lg))` and open to `inset(0 round var(--r-lg))` over 1100ms `--ease-precise` at 20% visibility; image scales 1.06 → 1. |
| Rise | Text blocks and glass panels move 32px → 0 over 800ms `--ease`, staggered 80ms. Opacity stays 1. No rotation. |
| Parallax | Only in the Details and Impressies sections, max 6% of the frame height. |
| Header | Glass bar fades in over 300ms. |
| Page transition | Optional View Transitions API cross-fade 250ms; optional a lime 2px progress line at the top during navigation. |

`prefers-reduced-motion: reduce`: framed hero from the start, film paused on poster, all statement words `--ink`, no mask/rise/parallax, no page transition.

---

## 12. Imagery and film

- Real photography and film only. No CGI or AI renders, no stock photography (a third party checking the site will recognise stock).
- Subjects: architectural details, materials (plaster, stone, wood, brass, glass), light on walls and floors, stairs, windows, doors, volumes of space; selected exteriors and interiors that cannot be traced to an address; quiet moments without people, or people seen from behind.
- Grading: high-key, warm-neutral whites, soft contrast, natural shadows; avoid blue casts and HDR. Daylight, mid-morning or overcast north light.
- **Hero film brief** (12–20s loop, 3–5 shots of 3–5s): morning light moving across a plastered wall; a window opening onto daylight; a slow push through an empty, renewed room; sunlight falling on a stair; a close-up of a hand-finished material. Slow camera (gimbal or slider), no fast cuts, no drone shots of identifiable properties, no text in the film.
- Formats: AVIF/WebP (+ JPEG fallback), responsive `srcset`, lazy below the fold, explicit width/height. EXIF/GPS stripped (§2).
- Alt text in the page language describing what is visible ("Licht op een gestucte wand naast een houten trap"), never an address. Purely decorative frames: `alt=""`.
- Photos used during design are placeholders; replace with licensed photography and film before launch.

---

## 13. Accessibility

- WCAG 2.2 AA; contrast per §3.2; body ≥ 16px; tap targets ≥ 44px.
- Landmarks `header`, `nav`, `main`, `footer`; one `h1` per page; headings in order.
- Film: pause control, no sound, poster fallback, reduced motion respected.
- Keyboard access for nav, menu sheet, language toggle, image scroller and form; focus always visible.
- Decorative SVG and hairline grids `aria-hidden="true"`; icon-only buttons have `aria-label`.
- Text on glass over film keeps ≥ 4.5:1 against the brightest frame behind it; increase the scrim if needed.

---

## 14. Content and microcopy

- Dutch first; "je" on the site, "u" in contracts and formal letters. Institutional, calm, short sentences.
- No superlatives ("de beste", "uniek", "exclusief"), no hype words, no promised returns, no statistics.
- Say what Supreme is and stands for; never list what it owns or how deals are done.

| NL | EN |
|---|---|
| Neem contact op | Get in touch |
| Over Supreme | About Supreme |
| Waar wij voor staan | What we stand for |
| Bedrijfsgegevens | Company details |
| Voor juridische of compliance-vragen | For legal or compliance questions |
| Pauzeer video / Speel video af | Pause video / Play video |
| Stuur bericht | Send message |
| Bedankt. We nemen persoonlijk contact met je op. | Thank you. We will contact you personally. |
| Dit veld is verplicht. | This field is required. |
| Vul een geldig e-mailadres in. | Enter a valid email address. |
| Menu / Sluit menu | Menu / Close menu |
| Privacybeleid · Cookiebeleid · Disclaimer · Colofon | Privacy policy · Cookie policy · Disclaimer · Colophon |

---

## 15. Meta, SEO and sharing

- Title pattern: `[Pagina] · Supreme Real Estate`; home: `Supreme Real Estate · Van oud naar waardevol`.
- Meta description (NL): "Supreme Real Estate is een vastgoedonderneming in Amsterdam, gericht op bestaande woningen en de lange termijn." (EN equivalent.)
- Open Graph 1200×630: Paper background, Dak-S mark (ink, window ink) + tagline in Funnel Display, one detail photo in a roof frame on the right.
- `hreflang` nl / en / x-default → nl. `Organization` structured data with verified legal name, logo, address, KvK number (`identifier`), VAT (`vatID`), contact point and `sameAs` LinkedIn.
- Drafts and previews: `noindex, nofollow`, excluded from sitemap.
- Performance: LCP < 2.5s on 4G mobile (hero poster is the LCP element), CLS < 0.1, INP < 200ms. Self-hosted fonts (`font-display: swap`); preload display font and hero poster; film loads after the poster.

---

## 16. Acceptance checklist

- [ ] No property beyond the four featured projects, no house number, postcode, price, portfolio figure or tenant detail anywhere, including image files, EXIF, alt text, metadata and sitemaps.
- [ ] Company details come from one config, match the KvK registration exactly, and hide any row without a verified value.
- [ ] No placeholder text, no stock or AI imagery, no broken links on the live site.
- [ ] Only tokens from §3 are used; no hard-coded colours, fonts or radii.
- [ ] Lime never appears as text, icon, line or logo colour on light; lime ≤ ~2% of any screen.
- [ ] At most one roof frame and one "lijn" per view.
- [ ] One `primary` button per view.
- [ ] Hero film has a visible pause control; reduced motion shows the poster.
- [ ] Complete and readable with JavaScript disabled and with reduced motion.
- [ ] No horizontal scroll at 360, 390, 768, 1024, 1440, 1920px.
- [ ] Keyboard access and visible focus everywhere.
- [ ] Lighthouse accessibility ≥ 95; LCP, CLS, INP within §15.
- [ ] NL and EN complete, with correct `lang` and `hreflang`.

---

## 17. Open items

- Final choice between Option 1 and Option 3 (this file covers Option 1; Option 3 has its own DESIGN file).
- Final vector wordmark (currently typeset).
- Trademark check for "Supreme" (BOIP) before launch.
- Native Dutch review of all copy.
- Verified company details (PRD §7).
- Hero film and licensed photography that pass the disclosure rules.
- Legal texts (privacy, cookies, disclaimer, colofon).
