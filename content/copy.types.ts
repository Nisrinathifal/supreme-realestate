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
  nav: {
    about: string;
    contact: string;
    menu: string;
    closeMenu: string;
    contactUs: string;
    /** The language button's name and hover hint, written in the language it leads to. */
    switchTo: string;
    sections: { id: string; label: string }[];
  };
  brand: { wordmark: string; descriptor: string; tagline: string };
  /** Hero: `headline` (H1, `\n` = line break) with `keyMessage` under it, over the full-bleed still. */
  hero: { headline: string; keyMessage: string; pause: string; play: string };
  statement: { label: string; text: string; aside: string };
  /** Shelf section: one statement whose inline icons fly into the shelf. `parts` alternate text and icon keys. */
  shelf: { parts: (string | { icon: ShelfIcon })[] };
  /** About + company details band under the collaboration ring: the company story in chapters, then the register. */
  aboutStory: {
    label: string;
    title: string;
    chapters: { name: string; body: string }[];
    close: string;
    /** The five stages of the 3D model (SCENE-3D.md): a short label, the line, and which chapter's body goes with it. */
    stages: { label: string; title: string; chapter: number | null }[];
    /** The closing line over the finished building, and the sentence under it. */
    finale: { title: string; body: string };
  };
  /** Company details band: the letter that comes out of the envelope. */
  register: {
    label: string;
    salutation: string;
    lead: string;
    verify: string;
    signoff: string;
    pending: string;
  };
  /** Steps section (after the reference "in years" band): label, three headline lines, three steps. */
  steps: { label: string; lines: string[]; items: { index: string; title: string; body: string }[] };
  /**
   * Projects: `intro` is the collaboration ring's headline among the cards and mascots, one entry per line (each line reveals on scroll); then a two-line heading (`label` muted, `title` ink) over four
   * stacking cards. Each card: index, title, body, a `note` saying what its photographs show, and one link (`cta`).
   */
  work: { intro: string[]; label: string; title: string; cta: string; items: { index: string; title: string; body: string; note: string }[] };
  /**
   * Project windows (concept 2026-10-05): the hotspot labels, the preview card and the project overlay. `items` is keyed by
   * project id (content/projects.ts); `hotspot` builds the accessible name of a window.
   */
  projects: {
    hotspot: (name: string) => string;
    eyebrow: string;
    explore: string;
    back: string;
    more: string;
    index: string;
    country: string;
    categories: { residential: string; mixed: string };
    /** The project page in the overlay (2026-10-06): facts, the story's chapter labels, before/after, photos, next. */
    page: {
      /** Labels of the credits (hero row and project details). `pending` stands in for a credit the owner has not given yet. */
      credits: { developer: string; architect: string; builder: string; interior: string; photography: string; location: string; category: string; pending: string };
      overview: string;
      details: string;
      /** The hero's scroll badge: its accessible name, also the text that turns around it. */
      scroll: string;
      chapters: { opportunity: string; approach: string; outcome: string; why: string };
      compare: { title: string; before: string; after: string; hint: string; slider: (room: string) => string };
      /** Room names for the before/after pairs, keyed by `compare[].room` in content/projects.ts. */
      rooms: Record<string, string>;
      gallery: { title: string; count: (n: number) => string; open: (i: number, n: number) => string; counter: (i: number, n: number) => string; close: string; prev: string; next: string };
      /** The other three projects at the foot of the page. */
      others: string;
      view: string;
    };
    /** Per project: `title` is the discreet headline (kind of building — city), `lede` one line under it, then the story. */
    items: Record<string, { title: string; lede: string; opportunity: string; approach: string; outcome: string; why: string }>;
  };
  /** Sky band: brand promise, lead and the two buttons (DESIGN §10.1 hero copy), over the sky photograph. */
  sky: { label: string; title: string; lead: string; ctaPrimary: string; ctaSecondary: string; cards: { title: string; body: string }[] };
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
    /** The letter beside the form (owner, 2026-10-08): its addressee line, and the way to write another once sent. */
    letterTo: string; again: string;
    submit: string; sending: string; success: string;
    errors: { required: string; email: string; consent: string; tooLong: string; rateLimited: string; failed: string };
  };
  about: { title: string; promiseLabel: string; promise: string; managementTitle: string };
  legal: { lastUpdated: string; placeholderNote: string };
  /** Footer after the reference: a contact band first (label, title, body, button), then the revealed footer. */
  footer: {
    links: { key: "privacy" | "cookies" | "disclaimer" | "colophon"; label: string }[];
    copyright: (year: number) => string;
    kvk: string;
    vat: string;
    linkedin: string;
    cta: { label: string; title: string; body: string; button: string };
    mailUs: string;
    backToTop: string;
  };
  notFound: { title: string; home: string };
  /** `address` / `phone`: fictional stand-ins shown in the header menu until company.json is verified. */
  placeholders: { description: string; story: string; media: string; film: string; credits: string; address: string[]; phone: string; social: string[] };
};
