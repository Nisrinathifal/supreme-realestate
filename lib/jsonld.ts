import { company, has, hasAddress } from "@/content/company";
import { absoluteUrl } from "./site";
import type { Lang } from "@/content/routes";

/** schema.org Organization (PRD §8, DESIGN §15). Only verified fields are emitted. */
export function organizationJsonLd(lang: Lang) {
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: has(company.tradeName) ? company.tradeName : company.legalName,
    legalName: company.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon-512.png"),
  };
  if (has(company.description[lang])) org.description = company.description[lang];
  if (has(company.kvk)) {
    org.identifier = { "@type": "PropertyValue", propertyID: "KvK", value: company.kvk };
  }
  if (has(company.vat)) org.vatID = company.vat;
  if (hasAddress(company.visitingAddress)) {
    const a = company.visitingAddress;
    org.address = {
      "@type": "PostalAddress",
      streetAddress: a.street,
      postalCode: a.postalCode,
      addressLocality: a.city,
      addressCountry: a.country,
    };
  }
  if (has(company.email) || has(company.phone)) {
    const cp: Record<string, unknown> = { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["nl", "en"] };
    if (has(company.email)) cp.email = company.email;
    if (has(company.phone)) cp.telephone = company.phone;
    org.contactPoint = [cp];
  }
  if (has(company.linkedin)) org.sameAs = [company.linkedin];
  return org;
}
