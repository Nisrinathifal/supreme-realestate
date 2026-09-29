/**
 * Copy shape shared by copy.nl.ts and copy.en.ts.
 * Strings wrapped in draft() are NOT in DESIGN-opsi1.md / PRD.md verbatim and need approval
 * (scripts/check-placeholders.ts fails a launch build while any remain).
 */
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
  nav: { about: string; contact: string; menu: string; closeMenu: string };
  brand: { wordmark: string; descriptor: string; tagline: string };
  hero: { display: string; lead: string; primary: string; secondary: string; coordinates: string; pause: string; play: string; filmCaption: string };
  statement: { label: string; text: string };
  principles: { label: string; title: string; items: { index: string; title: string; body: string }[] };
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
  placeholders: { description: string; story: string; media: string; film: string; credits: string };
};
