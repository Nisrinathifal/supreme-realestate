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

/** Optional cut-out subject layer over the hero (transparent PNG/WebP, e.g. a renewed volume or window). */
export const heroSubject: MediaSlot = { id: "hero-subject", ratio: "4/5", image: null };

/** Two capsule images under the statement. */
export const statementCapsules: MediaSlot[] = [
  { id: "capsule-01", ratio: "16/9", image: null },
  { id: "capsule-02", ratio: "16/9", image: null },
];

/** Pinned principles section: a tall vertical image (stair, wall, window) and one small thumbnail. */
export const principlesTall: MediaSlot = { id: "principles-tall", ratio: "4/5", image: null };
export const principlesThumb: MediaSlot = { id: "principles-thumb", ratio: "1/1", image: null };

/** Carousel photo cards, one per pair (Materiaal · Licht · Ruimte). */
export const carouselImages: MediaSlot[] = [
  { id: "pair-01", ratio: "4/5", image: null },
  { id: "pair-02", ratio: "4/5", image: null },
  { id: "pair-03", ratio: "4/5", image: null },
];

/** Closing: the capsule that grows into the wide footer image, and the small capsule at the end of the wordmark. */
export const closingCapsule: MediaSlot = { id: "closing-01", ratio: "21/9", image: null };
export const wordmarkCapsule: MediaSlot = { id: "closing-02", ratio: "16/9", image: null };

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
