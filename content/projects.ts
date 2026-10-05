import { interiorLiving, workCases, type ImageAsset } from "./media";

/**
 * A window in the hero film, in percent of the film frame (1920 × 1080), not of the viewport: the film covers the
 * hero anchored top centre, and components/windows sizes its hotspot layer the same way, so these numbers hold on
 * every screen. Tune them with `?debug=windows` on the homepage.
 */
export type WindowBox = { x: number; y: number; w: number; h: number };

export type Project = {
  id: string;
  name: string;
  /** City only (PRD §6.1): never a street number or postcode. */
  location: string;
  category: "residential" | "mixed";
  /** Shown in the window preview card and the project index. */
  preview: ImageAsset;
  /** The room behind the window; null until the owner supplies it (the project then has no window yet). */
  interior: ImageAsset | null;
  window: WindowBox | null;
};

/**
 * The four featured projects (owner, 2026-10-05; PRD §6.1). Descriptions live in copy.*.ts under `projects.items`.
 * Only the first has its window and interior so far; the others wait for their imagery and are listed in the index
 * as subdued entries.
 */
export const projects: Project[] = [
  {
    id: "durgerdammergouw",
    name: "Durgerdammergouw",
    location: "Amsterdam",
    category: "residential",
    preview: interiorLiving,
    interior: interiorLiving,
    // The right window on the second floor of the middle house (frame at 1003–1055 × 583–683 film px)
    window: { x: 52.2, y: 54, w: 2.75, h: 9.3 },
  },
  { id: "prinsen-bolwerk", name: "Prinsen Bolwerk", location: "Haarlem", category: "residential", preview: workCases[1].photos[0], interior: null, window: null },
  { id: "schoterweg", name: "Schoterweg", location: "Haarlem", category: "mixed", preview: workCases[2].photos[0], interior: null, window: null },
  { id: "bezaanjachtplein", name: "Bezaanjachtplein", location: "Amsterdam", category: "residential", preview: workCases[3].photos[0], interior: null, window: null },
];
