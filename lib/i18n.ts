import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/content/routes";

/** Resolves the [lang] segment or 404s. */
export function resolveLang(value: string): Lang {
  if (!isLang(value)) notFound();
  return value;
}

export const htmlLang = (lang: Lang) => (lang === "nl" ? "nl-NL" : "en");
