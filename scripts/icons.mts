/** Renders app icons from the Dak-S mark (DESIGN §6): favicon 32, apple-touch 180, icon 512. */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const svg = readFileSync("app/icon.svg");
mkdirSync("public", { recursive: true });
const out: [string, number][] = [
  ["public/favicon-32.png", 32],
  ["app/apple-icon.png", 180],
  ["public/icon-512.png", 512],
];
for (const [file, size] of out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().withMetadata({}).toFile(file);
  console.log(file);
}
