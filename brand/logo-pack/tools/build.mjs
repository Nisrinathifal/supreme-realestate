// Builds the logo pack: SVG (templates + per palette), PNG, app icons and the recolour tool.
// Usage (from brand/logo-pack):  node tools/build.mjs
// Change colours in palettes.json and rerun; change letterforms by rerunning tools/outline.py.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLogo, MARKS } from "./logo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(join(root, "../../package.json"))("sharp");
const glyphs = JSON.parse(readFileSync(join(root, "tools/glyphs.json"), "utf8")).weights;
const paletteData = JSON.parse(readFileSync(join(root, "palettes.json"), "utf8"));
const palettes = paletteData.presets;
const LAYOUTS = ["stacked", "horizontal", "mark"];
const VARIANTS = Object.keys(MARKS);

for (const d of ["svg", "png", "icons"]) rmSync(join(root, d), { recursive: true, force: true });
const write = (rel, data) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), data);
};
const png = (svg, width) => sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toBuffer();

// 1. Web templates: colours from CSS custom properties (--supreme-roof/-s/-word/-tag), fallback = original.
for (const v of VARIANTS) {
  for (const l of LAYOUTS) {
    write(`svg/web/supreme-${v}-${l}.svg`, buildLogo(glyphs, l, null, { variant: v, style: "flat" }));
    write(`svg/web/supreme-${v}-${l}-mono.svg`, buildLogo(glyphs, l, null, { variant: v, style: "mono" }));
  }
  write(`svg/web/supreme-${v}-stacked-gradient.svg`, buildLogo(glyphs, "stacked", null, { variant: v, style: "gradient" }));
  write(`svg/web/supreme-${v}-mark-gradient.svg`, buildLogo(glyphs, "mark", null, { variant: v, style: "gradient" }));
}
write(`svg/web/supreme-wordmark.svg`, buildLogo(glyphs, "wordmark", null, { style: "flat" }));
write(`svg/web/supreme-wordmark-mono.svg`, buildLogo(glyphs, "wordmark", null, { style: "mono" }));

// 2. Fixed colours per palette: SVG + transparent PNG (1024 and 2048 wide).
for (const [name, p] of Object.entries(palettes)) {
  const files = [["wordmark", buildLogo(glyphs, "wordmark", p, { style: p.style, mono: p.roof })]];
  for (const v of VARIANTS) for (const l of LAYOUTS) files.push([`${v}-${l}`, buildLogo(glyphs, l, p, { variant: v, style: p.style, mono: p.roof })]);
  for (const [base, svg] of files) {
    write(`svg/${name}/supreme-${base}.svg`, svg);
    for (const w of [1024, 2048]) write(`png/${name}/supreme-${base}-${w}.png`, await png(svg, w));
  }
}
for (const v of VARIANTS) {
  const grad = buildLogo(glyphs, "stacked", palettes.original, { variant: v, style: "gradient" });
  write(`svg/original/supreme-${v}-stacked-gradient.svg`, grad);
  write(`png/original/supreme-${v}-stacked-gradient-2048.png`, await png(grad, 2048));
}

// 3. Icons: mark centred on a square background (app icon, social avatar, favicon).
const square = (v, p, size, padRatio) => {
  const mark = buildLogo(glyphs, "mark", p, { variant: v, style: p.style, mono: p.roof });
  const [, , w, h] = mark.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
  const side = Math.max(w, h) / (1 - 2 * padRatio);
  const inner = mark.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${size}" height="${size}"><rect width="${side}" height="${side}" fill="${p.bg}"/><g transform="translate(${(side - w) / 2} ${(side - h) / 2})">${inner}</g></svg>`;
};
for (const v of VARIANTS) {
  for (const [name, p] of Object.entries(palettes)) {
    write(`icons/${name}/${v}-icon.svg`, square(v, p, 512, 0.16));
    for (const s of [32, 180, 192, 512, 1024]) write(`icons/${name}/${v}-icon-${s}.png`, await png(square(v, p, s, s <= 32 ? 0.08 : 0.16), s));
  }
}

// 4. Recolour tool: inline the logo module, glyphs and palettes into one offline HTML file.
const moduleSrc = readFileSync(join(root, "tools/logo.mjs"), "utf8").replace(/^export /gm, "");
const html = readFileSync(join(root, "tools/index.template.html"), "utf8")
  .replace("/*__LOGO__*/", () => moduleSrc)
  .replace("/*__DATA__*/", () => `const GLYPHS = ${JSON.stringify(glyphs)};\nconst PALETTE_DATA = ${JSON.stringify(paletteData)};`);
write("index.html", html);
console.log("logo pack built");
