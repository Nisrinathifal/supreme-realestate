/**
 * Copy shape shared by copy.nl.ts and copy.en.ts.
 * Strings wrapped in draft() are NOT in DESIGN-opsi1.md / PRD.md verbatim and need approval
 * (scripts/check-placeholders.ts fails a launch build while any remain).
 */
export type ShelfIcon = "bulb" | "hammer" | "clipboard" | "chart";

export type Copy = {
  siteName: string;
  meta: {
    homeTitle: string;
    titlePattern: (page: string) => string;
    description: string;
    pages: Record<"about" | "contact" | "privacy" | "cookies" | "disclaimer" | "colophon", { title: string; description: string }>;
    notFoundTitle: string;
  };
  a11y: { skip: string; languageSwitch: string; nl: string; en: string; mainNav: string; footerNav: string; legalNav: string; home: string };
  /** Header: menu pill, the sections it lists (anchors on the homepage) and the contact button. */
  nav: { about: string; contact: string; menu: string; closeMenu: string; contactUs: string; sections: { id: string; label: string }[] };
  brand: { wordmark: string; descriptor: string; tagline: string };
  /** Hero: `headline` (H1, `\n` = line break) with `keyMessage` under it, over the full-bleed still. */
  hero: { headline: string; keyMessage: string; pause: string; play: string };
  statement: { label: string; text: string; aside: string };
  /** Shelf section: one statement whose inline icons fly into the shelf. `parts` alternate text and icon keys. */
  shelf: { parts: (string | { icon: ShelfIcon })[] };
  principles: { label: string; title: string; sub: string; items: { index: string; title: string; body: string }[] };
  carousel: { label: string; title: string; sub: string; items: { title: string; body: string }[] };
  map: { label: string; title: string; sub: string; cta: string; dot: string };
  closing: { title: string; body: string; cta: string; marquee: string };
  details: { label: string; title: string; counter: (i: number, n: number) => string; scrollerLabel: string };
  companySection: { label: string; title: string };
  companyKeys: { legalName: string; tradeName: string; kvk: string; visitingAddress: string; postalAddress: string; vat: string; email: string; emailLegal: string; phone: string; availability: string; management: string; linkedin: string };
  companyLegalLine: string;
  contactSection: { label: string; title: string; body: string; cta: string };
  contactPage: { title: string; lead: string; methodsTitle: string; formTitle: string };
  form: {
    name: string; organisation: string; email: string; phone: string; subject: string; message: string;
    optional: string;
    subjects: { value: "samenwerking" | "pers" | "juridisch" | "overig"; label: string }[];
    subjectPlaceholder: string;
    consent: string; consentLink: string;
    submit: string; sending: string; success: string;
    errors: { required: string; email: string; consent: string; tooLong: string; rateLimited: string; failed: string };
  };
  about: { title: string; promiseLabel: string; promise: string; managementTitle: string };
  legal: { lastUpdated: string; placeholderNote: string };
  footer: { links: { key: "privacy" | "cookies" | "disclaimer" | "colophon"; label: string }[]; copyright: (year: number) => string; kvk: string; vat: string; linkedin: string };
  notFound: { title: string; home: string };
  /** `address` / `phone`: fictional stand-ins shown in the header menu until company.json is verified. */
  placeholders: { description: string; story: string; media: string; film: string; credits: string; address: string[]; phone: string };
};
