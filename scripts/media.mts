/**
 * Image pipeline (PRD §6.2, DESIGN §12): media/src/<name>.{png,jpg,jpeg,webp,tif} →
 * public/media/<name>-{640,1280,1920}.{avif,webp,jpg}. sharp drops EXIF/GPS/ICC unless withMetadata()
 * is called, so nothing is kept. Writes a manifest with the intrinsic size for width/height attributes.
 * Names must be neutral; `npm run check:filenames` runs before every build.
 * `npm run media -- name-01 name-02` rebuilds only those sources (manifest entries are merged).
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const srcDir = "media/src";
const outDir = "public/media";
const widths = [640, 1280, 1920];
mkdirSync(outDir, { recursive: true });

const manifestPath = join(outDir, "manifest.json");
const only = new Set(process.argv.slice(2));
const manifest: Record<string, { width: number; height: number }> =
  only.size && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const files = (existsSync(srcDir) ? readdirSync(srcDir).filter((f) => /\.(png|jpe?g|webp|tiff?)$/i.test(f)) : []).filter(
  (f) => !only.size || only.has(basename(f, extname(f))),
);
for (const file of files) {
  const name = basename(file, extname(file));
  const input = sharp(join(srcDir, file), { failOn: "none" }).rotate();
  const meta = await input.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  manifest[name] = { width: w, height: h };
  // Transparent sources (cut-outs, icons) keep their alpha: PNG fallback instead of JPEG.
  const alpha = Boolean(meta.hasAlpha);
  for (const width of widths) {
    const target = Math.min(width, w);
    const base = sharp(join(srcDir, file)).rotate().resize({ width: target, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(join(outDir, `${name}-${width}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(join(outDir, `${name}-${width}.webp`));
    if (alpha) await base.clone().png({ compressionLevel: 9, palette: true, quality: 92, effort: 10, dither: 1 }).toFile(join(outDir, `${name}-${width}.png`));
    else await base.clone().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(join(outDir, `${name}-${width}.jpg`));
  }
  console.log(`${name}: ${w}×${h}${alpha ? " (alpha)" : ""} → ${widths.length * 3} files`);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`media: ${files.length} source image(s), manifest written`);
