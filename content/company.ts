import raw from "./company.json";
import type { Lang } from "./routes";

export type Address = { street: string; postalCode: string; city: string; country: string };
export type Person = { name: string; role: { nl: string; en: string } };

export type Company = {
  legalName: string;
  tradeName: string;
  kvk: string;
  vat: string;
  visitingAddress: Address;
  postalAddress: Address;
  email: string;
  emailLegal: string;
  phone: string;
  availability: Record<Lang, string>;
  management: Person[];
  linkedin: string;
  description: Record<Lang, string>;
  story: Record<Lang, string>;
  credits: { photography: string; film: string };
};

export const company = raw as unknown as Company;

/** True when a verified value exists. Empty strings and whitespace count as missing. */
export const has = (v: string | undefined | null): v is string => typeof v === "string" && v.trim().length > 0;

export const hasAddress = (a: Address) => has(a.street) && has(a.city);

export const formatAddressLines = (a: Address): string[] =>
  hasAddress(a) ? [a.street, [a.postalCode, a.city].filter(has).join(" ")].filter(has) : [];

/** The country of an address, written out per language (only the countries Supreme is registered in). */
const COUNTRIES: Record<string, Record<Lang, string>> = { NL: { nl: "Nederland", en: "Netherlands" } };
export const countryName = (code: string, lang: Lang) => COUNTRIES[code]?.[lang] ?? "";

/** Phone number as a tel: href (digits and leading plus only). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Postal address only when it exists and differs from the visiting address. */
export const postalDiffers = () =>
  hasAddress(company.postalAddress) &&
  JSON.stringify(company.postalAddress) !== JSON.stringify(company.visitingAddress);
