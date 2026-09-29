# REFERENCE-MOTION.md — rebuilding the reference site's layout and scroll animations

Spec for rebuilding the layout and scroll animations seen in the reference screen recording ("VeyraMind" concept, 23s). Hand this to the coding agent together with the project's own `DESIGN-*.md`.

**Rebuild the structure and the motion, not the brand.** Do not reuse the reference's name, logo, copy, images or colours as-is. Every image, text and colour comes from our own design file and content. The reference imagery looks AI-generated; do not use it.

---

## 1. What the recording actually is

- The recording is a macOS screen capture ("Stop Screen Recording" appears at the end) of a **presentation video**, not of a browser.
- The page sits inside a rounded white "device" frame on a grey canvas, and at the end neighbouring frames (the dark building section, a lime card) are visible side by side. That is typical of a Dribbble/Behance-style motion shot.
- **So there is no way to confirm the original tool from the video.** Most likely it was designed in Figma and animated in a motion tool (After Effects, Jitter, or a Figma/Framer prototype). It may never have existed as a coded website.
- Everything below is a **reconstruction**: how to get the same result on a real website.

### Likely tools (best estimate, not confirmed)

| Layer | Most likely | Alternatives |
|---|---|---|
| Design | Figma | Framer |
| Presentation animation | After Effects or Jitter | Figma Smart Animate, Framer scroll effects |
| Imagery | AI-generated renders | — |

### How to build it for real

| Need | Use |
|---|---|
| Framework | Next.js (App Router) + TypeScript, or plain Vite if static |
| Scroll-linked animation, pinning, scrubbing | **GSAP + ScrollTrigger** |
| Smooth scrolling | **Lenis** |
| Line/word text reveals | GSAP **SplitText** |
| Image expanding into another layout | GSAP **Flip**, or a scrubbed width/radius tween |
| Marquee | CSS keyframes (or GSAP `repeat: -1`) |
| React integration | `@gsap/react` (`useGSAP`) |

GSAP and its plugins (ScrollTrigger, SplitText, Flip) have been free to use since 2025, as far as I know. Check the current licence on gsap.com before shipping.

No-code alternative: **Framer** can do most of this (scroll transforms, sticky sections, the Ticker component for the marquee, appear effects). The pinned card sequences in §5.3 and §5.4 are much harder there.

---

## 2. Setup

```bash
npm i gsap @gsap/react lenis
```

```ts
// lib/motion.ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

export function initSmoothScroll() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return null;                      // native scroll when reduced motion
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const ease = {
  out: "power3.out",       // entrances
  inOut: "power2.inOut",   // scrubbed transforms
  pop: "back.out(1.7)",    // chips, pins, avatars
};
```

**Rules for every animation**
- Wrap all timelines in `gsap.matchMedia()` with two branches:
  - `(prefers-reduced-motion: no-preference)`: full motion.
  - `(prefers-reduced-motion: reduce)`: no pins, no scrub, content visible.
- Content must be visible without JavaScript. Set start states in JS (`gsap.set`), never in CSS (`opacity: 0`).
- Animate only `transform`, `opacity`, `clip-path` and `filter` (small blur values). Never animate `top`, `left`, `width` or `height` on large elements, except the container "expand" in §4, which is done with `clip-path` or `scale`.
- On mobile (<768px): no pinning longer than `+=100%`, no floating card sequences. Use stacked content with simple fade-up entrances.

---

## 3. Page shell (from the reference)

- Grey outer background with the page inside a white card (radius ~40px): this is the **presentation frame**, not the site. **Do not build it.** The real page starts at the hero.
- Hero and dark sections are rounded panels with a small inset from the viewport edges (~12–16px). Light sections are full width, with content in a ~1280px column.
- Header: logo left; two pill buttons right (one dark "primary", one light "Menu").

---

## 4. Reusable motion patterns

These patterns repeat through the page. Build them once as hooks or components.

### P1. Fade-up entrance
Elements start at `y: 40, opacity: 0` and animate to `y: 0, opacity: 1`.
- Duration 0.9s, `power3.out`, stagger 0.08.
- ScrollTrigger `start: "top 85%"`, `once: true`.

### P2. Line reveal (scrubbed)
Split the paragraph into lines with SplitText. Each line goes from `opacity: 0.25` to `opacity: 1` in sequence, tied to scroll.
```ts
const split = SplitText.create(el, { type: "lines" });
gsap.fromTo(split.lines, { opacity: 0.25 }, {
  opacity: 1, stagger: 0.5, ease: "none",
  scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
});
```

### P3. Blur-in heading
`filter: blur(12px), opacity: 0, y: 20` → `blur(0), opacity: 1, y: 0`.
- Duration 1s, `power3.out`, `start: "top 80%"`.

### P4. Container expand (dark panels)
A dark panel enters from below as a smaller, lighter card and grows to the full inset width as it reaches the top.
- Start: `clip-path: inset(6% 4% 0% 4% round 32px)` and background one step lighter (`#3a3a3a` → final dark).
- End: `clip-path: inset(0% 0% 0% 0% round 32px)`.
- `scrub: true`, `start: "top bottom"`, `end: "top 20%"`.
- Animate the background colour on the same timeline.

### P5. Pop
Chips, pins and avatars go from `scale: 0.6, opacity: 0` to `scale: 1, opacity: 1`.
- Duration 0.5s, `back.out(1.7)`, stagger 0.06.
- `transformOrigin` at the pin tail (bottom-left).

### P6. Glass-to-solid card
A floating card enters as frosted glass and becomes solid.
- Start: `backgroundColor: rgba(255,255,255,.25)`, `backdropFilter: blur(14px)`, `y: 60`, `rotate: ±8°`, `opacity: 0`.
- Middle: glass, visible.
- End: `rgba(255,255,255,1)`, `rotate: ±4°`, `y: 0`.
- Scrubbed inside a pinned timeline.

### P7. Clip wipe (image replace)
The new image sits on top of the old one and is revealed from the top.
- `clip-path: inset(100% 0 0 0)` → `inset(0 0 0 0)`.
- 0.8s `power2.inOut`, or scrubbed.

### P8. Float
Idle motion on floating cards: `y` ±6px and `rotate` ±0.5°, 4–6s `sine.inOut`, `yoyo`, `repeat: -1`. Disabled with reduced motion.

---

## 5. Sections, in order

Durations below are pin lengths in scroll distance. The recording's timing is approximated from frames sampled 5 times per second.

### 5.1 Hero (0–1.4s in the recording)

**Layout**
- Rounded panel, full-bleed landscape image.
- Headline top-left (~64–80px on desktop), a short lead, one dark CTA.
- Main subject: a **separate cut-out image layer** (house PNG with transparency) over the landscape background.
- Floating tilted "listing card" (rotated ~12°, a stack of two photos) near the top-right.
- 2–3 small pill chips pinned over the scene.

**Load animation** (plays once, about 1.6s total)
1. Background: `scale 1.12 → 1`, 1.6s, `power2.out`.
2. Cut-out subject: `y: 12% → 0`, `scale: .92 → 1`, 1.4s, `power3.out`, starting 0.15s after the background (it visibly "rises" into the scene).
3. Headline and lead: P1, starting 0.3s in.
4. Floating card: `rotate: 25° → 12°`, `y: 40 → 0`, `opacity: 0 → 1`, 0.9s `back.out(1.4)`, then P8.
5. Chips: P5, staggered, starting 0.9s in.

**On scroll**
- Content moves up faster than the image: `yPercent: -20` on the text, `-8` on the subject, `-4` on the background, all scrubbed.

### 5.2 Statement (1.4–3.8s)

**Layout**
- Large paragraph (~44–56px, 3 lines) in a ~70% column.
- Below it: two capsule images (radius 999px), one with a small chip at the top-left, one with a dark chip at the bottom.
- A short text column on the right.

**Motion**
- Paragraph: P2 (line reveal).
- Capsules: P1 with `scale .9 → 1`.
- Chips: P5.
- The whole block enters with a slight upward move and fade (P1) before the line reveal starts.

### 5.3 "How it works": pinned dark section (3.8–8.6s)

**Layout**
- Dark panel (P4 on enter).
- Centred heading + subline.
- A tall building photo, centred and anchored to the bottom, taller than the viewport.
- Floating cards around it:
  - Card A: accent colour.
  - Cards B and C: white.
  - An avatar circle with an accent ring.
  - A small photo thumbnail with a 4px accent border.
  - A "Room 202"-style pill with a pulsing ring.

**Motion**: pin the section, `end: "+=220%"`, `scrub: 1`. One timeline:

| Timeline position | What happens |
|---|---|
| 0–0.15 | P4 container expand finishes; heading P1 |
| 0.10–0.30 | Card A enters from left (`x: -60, rotate: -12 → -6`, opacity 0 → 1); thumbnail pops (P5) |
| 0–1.00 | Building photo moves up continuously (`yPercent: 0 → -35`): the "camera" travels up the facade |
| 0.35–0.50 | Heading leaves upward; card A exits up-left and fades |
| 0.40–0.60 | Card B enters from right as glass → solid (P6), `rotate: 8 → 4` |
| 0.50–0.70 | Card C enters from left as glass → solid (P6), `rotate: -8 → -3`; avatar pops next to B |
| 0.70–0.85 | Bottom thumbnail (accent border) and pill pop in; pill ring pulses (CSS `@keyframes` scale 1 → 1.8, opacity .6 → 0, 1.6s infinite) |
| 0.85–1.00 | Hold, then unpin; the next section scrolls over |

**Mobile:** no pin. Photo, then cards stacked, each with P1.

### 5.4 "Save more": pinned card-pair carousel (8.6–13.8s)

**Layout**
- Centred heading + subline (P3 blur-in).
- Below: a pair of equal cards (radius ~28px), one text card and one photo card:
  - Text card: pale accent or grey background, large statement top, small body + pager `01 03` bottom.
  - Photo card: photo with small overlays (chip, mini listing card).
- Three pairs in total.

**Motion**: pin, `end: "+=300%"`, `scrub: 1`.
- **Pair 1 → 2**:
  - The photo card slides left over the text card (`xPercent: 0 → -103`, z-index above).
  - Meanwhile the text card's content fades and blurs out (`opacity → 0`, `blur → 8px`).
  - The new pair's text card fades and blurs in on the right.
  - The photo card takes the left slot.
- **Pair 2 → 3**:
  - The new photo wipes in from the top over the old one (P7).
  - The text card swaps background (grey → pale accent) with a cross-fade.
  - The heading on the text card changes with a 0.3s blur cross-fade.
- The pager numbers update with each step (`01` → `02` → `03`).
- **Mobile:** no pin. Simple horizontal snap scroller (`scroll-snap-type: x mandatory`) with the same cards.

### 5.5 Map: dark section (13.4–16.2s)

**Layout**
- Dark panel with a dark street-map background (a static SVG or image, not a live map).
- Centred heading, subline and white pill CTA.
- Pins spread around the map:
  - Grey pills with a tail.
  - Accent pills with an icon.
  - Photo thumbnails with a white border.
- A small pulsing dot next to the CTA.

**Motion**
- Container: P4.
- Map background: `scale 1.08 → 1`, scrubbed during the expand.
- Heading: P1.
- Pins: P5, staggered 0.05 in random order (use `stagger: { each: .05, from: "random" }`).
- Thumbnails: pop after the pins.
- On scroll through: slight parallax on the pins (`yPercent: -10` scrubbed). No pin needed.

### 5.6 Closing CTA + marquee (16.2–18.2s)

**Layout**
- Two columns: large headline on the left; short text + dark CTA on the right.
- Below: a marquee of the wordmark/tagline in large type, with a **capsule image fixed in the centre** over it.

**Motion**
- Headline: P1.
- Marquee: CSS `@keyframes` translateX 0 → -50% on a doubled track, 30–40s linear infinite. Paused with reduced motion.

### 5.7 Capsule → full image → footer (18.2–20.4s)

This is the signature transition. The small capsule image in the marquee **grows into the wide footer image**.

- Pin the marquee block, `end: "+=120%"`, `scrub: 1`.
- Capsule:
  - Width 30% → 100% of the content column.
  - Height 180px → ~45vh.
  - Border radius 999px → 28px.
  - Implement with Flip: record the state, apply the final class, `Flip.from(state, { scrub })` inside the ScrollTrigger timeline. A scrubbed `clip-path` + `scale` also works.
- Marquee text: fades out (`opacity → 0`) in the first 40% of the timeline.
- **Giant wordmark** below the image: each letter in `overflow: hidden` goes from `yPercent: 100` to `0`, stagger 0.03, 0.9s `power3.out`, when it enters.
- A small capsule image at the end of the wordmark pops (P5 with `scale .6`).
- Footer bar: social icons + links, P1.

---

## 6. Style tokens seen in the reference (for orientation only)

Use our own tokens from `DESIGN-*.md`. These values only show the reference's proportions.

| Token | Reference value |
|---|---|
| Light background | `#FFFFFF` |
| Dark panels | `#161616`; entering state `#3a3a3a` |
| Accent (fills only) | `#CDEB6F` |
| Pale accent card | `#EBFED1` |
| Grey card | `#EDEDED` |
| Radius | panels 32–40px; cards 24–28px; chips and buttons pill |
| Type | neo-grotesk (Helvetica/Inter-like), medium weight, tight tracking; headings 56–80px desktop; body 15–17px |
| Shadows | soft, only on floating cards (`0 24px 48px -22px rgba(0,0,0,.35)`) |

---

## 7. Performance and accessibility

- Aim for 60fps on a mid-range laptop:
  - `will-change: transform` only on elements that are animating.
  - Lazy-load images below the fold.
  - Limit `backdrop-filter` to ≤ 3 elements on screen at once.
- Call `ScrollTrigger.refresh()` after images and fonts load. Use `invalidateOnRefresh: true` on pinned timelines.
- `prefers-reduced-motion: reduce`:
  - No Lenis, no pins, no scrub, no float, no marquee.
  - All content visible in its final state.
- Pinned sections must stay keyboard-navigable; never trap focus inside a pin.
- Test on iOS Safari. Pinning plus smooth scroll needs `ScrollTrigger.normalizeScroll(true)` only if jitter appears. Test before enabling it.

---

## 8. Build order and checklist

1. Setup (§2), the static layout of all sections, content from our own files.
2. Patterns P1–P8 as utilities.
3. Hero load animation.
4. Statement.
5. Pinned "how it works".
6. Carousel.
7. Map.
8. Capsule → footer.
9. Reduced-motion and mobile variants.
10. Performance pass.

- [ ] No reference brand name, copy, images or exact colours in the build.
- [ ] Every section readable with JavaScript disabled and with reduced motion.
- [ ] No horizontal scroll at 360–1920px.
- [ ] Pins release correctly after resize (`ScrollTrigger.refresh()`).
- [ ] Lighthouse performance ≥ 85 on mobile despite the animation.

---

## 9. Note for the Supreme project

The Supreme direction is calm and institutional, and does not disclose projects (see `DESIGN-*.md` and `PRD.md`). When using this reference for Supreme:

- **Keep:** P1, P2, P3, P4, P7, the pinned dark section (with principles instead of feature cards) and the capsule → footer transition.
- **Drop or tone down:**
  - Tilt: 0° instead of ±4–12°.
  - No price or listing chips.
  - No map with pins.
  - No float (P8).
  - No pop-heavy sequences.
- Motion should feel precise and slow (`power2.inOut`, longer durations), not playful.
