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
  /** The room behind the window. */
  interior: ImageAsset | null;
  window: WindowBox | null;
  /** The interior is a stand-in from the owner's archive until the project's own imagery arrives. */
  placeholder?: boolean;
};

/**
 * The four featured projects (owner, 2026-10-05; PRD §6.1), each on a window of a different house in the film.
 * Descriptions live in copy.*.ts under `projects.items`. Only the first has its own interior (the owner's render);
 * the other three show archive interiors as stand-ins until their imagery arrives.
 */
export const projects: Project[] = [
  {
    id: "durgerdammergouw",
    name: "Durgerdammergouw",
    location: "Amsterdam",
    category: "residential",
    preview: interiorLiving,
    interior: interiorLiving,
    // Middle house, second floor, right window (frame at 1003–1055 × 583–683 film px)
    window: { x: 52.2, y: 54, w: 2.75, h: 9.3 },
  },
  {
    id: "prinsen-bolwerk",
    name: "Prinsen Bolwerk",
    location: "Haarlem",
    category: "residential",
    preview: workCases[1].photos[2],
    interior: workCases[1].photos[2],
    placeholder: true,
    // Dark house on the left, second row, middle window (471–520 × 628–710)
    window: { x: 24.5, y: 58.1, w: 2.55, h: 7.6 },
  },
  {
    id: "schoterweg",
    name: "Schoterweg",
    location: "Haarlem",
    category: "mixed",
    preview: workCases[2].photos[0],
    interior: workCases[2].photos[0],
    placeholder: true,
    // Brown house, lower row, the lit window (696–745 × 671–758)
    window: { x: 36.25, y: 62.1, w: 2.55, h: 8.1 },
  },
  {
    id: "bezaanjachtplein",
    name: "Bezaanjachtplein",
    location: "Amsterdam",
    category: "residential",
    preview: workCases[3].photos[0],
    interior: workCases[3].photos[0],
    placeholder: true,
    // Dark house on the right, lower row, middle window (1487–1535 × 673–763)
    window: { x: 77.4, y: 62.3, w: 2.5, h: 8.3 },
  },
];
