/**
 * Fails the build when a media file name looks like a street address (PRD §6.2).
 * Checks public/media and media/src. Extend the pattern list as needed; keep names neutral
 * (e.g. detail-stair-01, light-plaster-02).
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const roots = ["public/media", "media/src"];

const streetWords =
  "straat|gracht|laan|plein|weg|kade|singel|dwars|steeg|burgwal|dijk|markt|park|hof|baan|pad|street|avenue|road|lane|square|canal";

const patterns: { name: string; re: RegExp }[] = [
  { name: "street word + number", re: new RegExp(`(${streetWords})[-_ ]?\\d{1,4}[a-z]?(?![0-9])`, "i") },
  { name: "street word at word end", re: new RegExp(`[a-z]{3,}(${streetWords})(?![a-z])`, "i") },
  { name: "dutch postcode", re: /\b\d{4}[-_ ]?[a-z]{2}\b/i },
  { name: "house-number pattern (word-number-suffix)", re: /[a-z]{4,}[-_ ]\d{1,4}(?:[-_ ]?(?:hs|bg|[1-4]|[a-z]))(?![a-z0-9])/i },
  { name: "coordinates", re: /\d{1,2}\.\d{3,}[-_ ]\d{1,2}\.\d{3,}/ },
];

const allowedNumeric = /^[a-z]+(?:-[a-z]+)*-\d{2}(?:-\d{3,4})?$/; // detail-stair-01, detail-stair-01-1280

function walk(dir: string, out: string[] = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const offenders: string[] = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const base = file.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "");
    if (allowedNumeric.test(base)) continue;
    for (const { name, re } of patterns) {
      if (re.test(base)) {
        offenders.push(`${file}  (${name})`);
        break;
      }
    }
  }
}

if (offenders.length) {
  console.error("Media file names that look like addresses (PRD §6.2):\n" + offenders.map((o) => `  - ${o}`).join("\n"));
  process.exit(1);
}
console.log("check:filenames ok");
