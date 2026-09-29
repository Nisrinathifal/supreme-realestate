/**
 * Media slots. null = asset not delivered yet; the UI renders a neutral placeholder frame.
 * File names must be neutral (DESIGN §2); scripts/check-filenames.ts enforces a pattern list.
 * Alt text lives here per language and describes what is visible, never an address.
 */
export type Ratio = "16/9" | "4/5" | "1/1" | "21/9";

export type ImageAsset = {
  /** Base name without extension, under /public/media (pipeline output). */
  src: string;
  width: number;
  height: number;
  alt: { nl: string; en: string };
};

export type VideoAsset = {
  webm: string | null;
  mp4: string | null;
  poster: ImageAsset | null;
};

export type MediaSlot = { id: string; ratio: Ratio; image: ImageAsset | null };

export const heroFilm: VideoAsset = { webm: null, mp4: null, poster: null };

export const principlesMedia: MediaSlot = { id: "principles", ratio: "21/9", image: null };

export const detailSequence: MediaSlot[] = [
  { id: "detail-01", ratio: "4/5", image: null },
  { id: "detail-02", ratio: "16/9", image: null },
  { id: "detail-03", ratio: "1/1", image: null },
  { id: "detail-04", ratio: "16/9", image: null },
  { id: "detail-05", ratio: "4/5", image: null },
];

export const impressions: { wide: MediaSlot; left: MediaSlot; right: MediaSlot } = {
  wide: { id: "impression-01", ratio: "21/9", image: null },
  left: { id: "impression-02", ratio: "4/5", image: null },
  right: { id: "impression-03", ratio: "16/9", image: null },
};

export const aboutHero: MediaSlot = { id: "about-01", ratio: "21/9", image: null };
