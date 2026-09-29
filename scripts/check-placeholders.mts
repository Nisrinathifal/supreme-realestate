/**
 * Pre-launch content check (PRD §10). Counts:
 *  - draft() copy strings in content/copy.*.ts
 *  - empty required company fields in content/company.json
 *  - media slots still null in content/media.ts
 *  - legal texts still marked as placeholder
 * Exits 1 in a production build unless ALLOW_PLACEHOLDERS=1.
 */
import { readFileSync, existsSync } from "node:fs";

const problems: string[] = [];

for (const f of ["content/copy.nl.ts", "content/copy.en.ts"]) {
  const n = (readFileSync(f, "utf8").match(/\bdraft\(/g) ?? []).length;
  if (n) problems.push(`${f}: ${n} draft() strings awaiting approval`);
}

const company = JSON.parse(readFileSync("content/company.json", "utf8"));
const required = ["legalName", "kvk", "email", "phone"];
for (const k of required) if (!String(company[k] ?? "").trim()) problems.push(`company.json: ${k} missing`);
if (!String(company.visitingAddress?.street ?? "").trim()) problems.push("company.json: visitingAddress missing");
for (const l of ["nl", "en"]) if (!String(company.description?.[l] ?? "").trim()) problems.push(`company.json: description.${l} missing`);

const media = readFileSync("content/media.ts", "utf8");
const nulls = (media.match(/:\s*null/g) ?? []).length;
if (nulls) problems.push(`content/media.ts: ${nulls} media slots still null`);

for (const l of ["nl", "en"]) {
  for (const p of ["privacy", "cookies", "disclaimer", "colofon"]) {
    const f = `content/legal/${p}.${l}.md`;
    if (!existsSync(f)) problems.push(`${f}: missing`);
    else if (/placeholder/i.test(readFileSync(f, "utf8"))) problems.push(`${f}: still a placeholder`);
  }
}

if (problems.length) {
  console.log("Placeholders remaining:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  const strict = process.env.NODE_ENV === "production" && process.env.ALLOW_PLACEHOLDERS !== "1";
  if (strict) process.exit(1);
} else {
  console.log("check:placeholders ok");
}
