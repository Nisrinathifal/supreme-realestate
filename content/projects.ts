import { beforeImages, caseImages, interiorLiving, type ImageAsset } from "./media";

/**
 * A window in the hero film, in percent of the film frame (1920 × 1080), not of the viewport: the film covers the
 * hero anchored top centre, and components/windows sizes its hotspot layer the same way, so these numbers hold on
 * every screen. Tune them with `?debug=windows` on the homepage.
 */
export type WindowBox = { x: number; y: number; w: number; h: number };

/** A before/after pair: the same room during the works and finished. `room` keys copy `projects.page.rooms`. */
export type Comparison = { room: string; before: ImageAsset; after: ImageAsset };

/**
 * Who made it. null = not given by the owner yet: the page says so ("To be confirmed") rather than guess. The
 * developer is always Supreme Real Estate (copy `siteName`). Names only, no contact details.
 */
export type Credits = { architect: string | null; builder: string | null; interior: string | null; photography: string | null };
const unknown: Credits = { architect: null, builder: null, interior: null, photography: null };

export type Project = {
  id: string;
  name: string;
  /** City only (PRD §6.1): never a street number or postcode. */
  location: string;
  category: "residential" | "mixed";
  /** Shown in the window preview card and the project index. */
  preview: ImageAsset;
  /** The room behind the window. */
  interior: ImageAsset | null;
  window: WindowBox | null;
  /** The project page's photographs, in reading order (the first opens the gallery). */
  gallery: ImageAsset[];
  /** Before/after pairs; none = the page leaves the section out. */
  compare: Comparison[];
  credits: Credits;
  /** The imagery is a stand-in from the owner's archive until the project's own set arrives. */
  placeholder?: boolean;
};

/**
 * The four featured projects (owner, 2026-10-05; PRD §6.1), each on a window of a different house in the film.
 * Their stories live in copy.*.ts under `projects.items`. Every photograph is the project's own (2026-10-07, matched
 * to the project pages of the owner's old site); Durgerdammergouw has the owner's render and the plot from the air.
 */
export const projects: Project[] = [
  {
    id: "durgerdammergouw",
    name: "Durgerdammergouw",
    location: "Amsterdam",
    category: "residential",
    preview: interiorLiving,
    interior: interiorLiving,
    gallery: [interiorLiving, ...caseImages.a],
    compare: [],
    // Middle house, second floor, right window (frame at 1003–1055 × 583–683 film px)
    credits: unknown,
    window: { x: 52.2, y: 54, w: 2.75, h: 9.3 },
  },
  {
    id: "prinsen-bolwerk",
    name: "Prinsen Bolwerk",
    location: "Haarlem",
    category: "residential",
    preview: caseImages.b[0],
    interior: caseImages.b[0],
    gallery: caseImages.b,
    compare: [], // no photographs of it before the works
    // Dark house on the left, second row, middle window (471–520 × 628–710)
    credits: unknown,
    window: { x: 24.5, y: 58.1, w: 2.55, h: 7.6 },
  },
  {
    id: "schoterweg",
    name: "Schoterweg",
    location: "Haarlem",
    category: "mixed",
    preview: caseImages.c[0],
    interior: caseImages.c[0],
    gallery: caseImages.c,
    compare: [{ room: "kitchen", before: beforeImages.c[0], after: caseImages.c[0] }],
    // Brown house, lower row, the lit window (696–745 × 671–758)
    credits: unknown,
    window: { x: 36.25, y: 62.1, w: 2.55, h: 8.1 },
  },
  {
    id: "bezaanjachtplein",
    name: "Bezaanjachtplein",
    location: "Amsterdam",
    category: "residential",
    preview: caseImages.d[0],
    interior: caseImages.d[0],
    gallery: caseImages.d,
    compare: [],
    // Its own photographs (from the owner's old site), so not a stand-in
    // Dark house on the right, lower row, middle window (1487–1535 × 673–763)
    credits: unknown,
    window: { x: 77.4, y: 62.3, w: 2.5, h: 8.3 },
  },
];
