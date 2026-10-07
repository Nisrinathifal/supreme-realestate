# Supreme Real Estate logo pack

Two mark shapes on one 30° isometric grid, same wordmark and colours (bronze roof, slate-green S):
- **A · Roof-S** (`roof`): geometry grid + property + flow + roof/structure. Roof chevrons over a folded S.
- **B · Cube-S** (`cube`): letter S + property + structure. An S cut from an isometric cube.

## Open
- `index.html` — recolour tool. Pick a shape (Bentuk), a colour palette (Terang or Gelap) or your own colours, choose Flat / Gradient / Mono, download any lockup as SVG or PNG (2048 px). Works offline; the interface is in Indonesian.

## Files
| Folder | What |
|---|---|
| `svg/web/` | Templates for the web. Colours come from CSS variables (fallback = original). `*-mono.svg` uses `currentColor`. |
| `svg/<palette>/` | Fixed colours per palette, for print and design tools. |
| `png/<palette>/` | Transparent PNG, 1024 and 2048 px wide. |
| `icons/<palette>/` | Mark on a square background: 32 (favicon), 180 (Apple), 192, 512, 1024, plus `<shape>-icon.svg`. |

File names: `supreme-<shape>-<lockup>` with shape `roof` or `cube` and lockup `stacked`, `horizontal` or `mark`; `supreme-wordmark` has no shape. Icons: `<shape>-icon-<size>.png`. Palettes (see `palettes.json`), each with a light and a dark preset:

| Group | Presets | Roof · S · tagline (light) | Roof · S · tagline (dark) |
|---|---|---|---|
| Concept | `original`, `reverse` | Bronze · Slate green · Grey | Bronze · Cream · Bronze |
| Daylight | `daylight`, `daylight-dark` | Sage · Canal ink · Graphite | Supreme lime · Paper · Sage |
| Soft canal | `soft-canal`, `soft-canal-dark` | Brass · Canal green · Moss grey | Brass · Cream · Sage |
| Deep canal | `deep-canal`, `deep-canal-dark` | Harbour green · Deep canal · Canal teal | Fresh green · Mint · Fresh green |
| Mono | `ink`, `white` | one colour | one colour |

Daylight follows the site rule: Supreme lime only on dark, never on Paper. The full swatch list of every palette is in `palettes.json` and shows up inside the colour pickers of `index.html`.

## Recolour on a website
Inline the SVG from `svg/web/` and set:

```css
:root {
  --supreme-roof: #9D8574;
  --supreme-s: #33494A;
  --supreme-word: #33494A;
  --supreme-tag: #8A8B86;
}
```

CSS variables only reach an SVG that is inlined in the page. Used as `<img src>`, the SVG shows its fallback colours; use a file from `svg/<palette>/` in that case. For the mono templates, set `color` on the parent. Cube-S mono shows its roof-coloured faces at 55% opacity so the S stays readable.

## Rebuild
```bash
node tools/build.mjs
```
- Colours: edit `palettes.json` (`groups` = swatches and note, `presets` = logo colours per preset), then rebuild.
- Mark proportions: `ROOF` and `CUBE` in `tools/logo.mjs`. To add a shape, write a builder like `cubeMark` and register it in `MARKS`; build and tool pick it up.
- Letterforms: `python3 tools/outline.py` re-outlines Outfit (SIL Open Font License) into `tools/glyphs.json`. SUPREME is interpolated between Regular and Bold (about Medium).

## Use
- Clear space around the logo: at least the height of one roof band on every side.
- Minimum size: mark 24 px, horizontal lockup 120 px wide.
- Do not stretch, rotate, outline or box the logo. Always write "Supreme Real Estate" in text, never "Supreme" alone.
