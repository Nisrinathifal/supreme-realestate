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
  /** Transparent source: the pipeline wrote a PNG fallback instead of JPEG. */
  alpha?: boolean;
};

export type VideoAsset = {
  webm: string | null;
  mp4: string | null;
  /** ≤980px source (720p), optional. */
  mp4Mobile: string | null;
  poster: ImageAsset | null;
  /** Play once and hold the last frame (a story film), or loop. */
  loop: boolean;
  /** Playback speed (1 = as encoded). */
  rate?: number;
};

export type MediaSlot = { id: string; ratio: Ratio; image: ImageAsset | null };


/**
 * Hero still (concept supplied 2026-09-30, clean render without logo or copy): a white house in daylight,
 * the city skyline behind it. hero-still-01 is the flattened design mock-up, kept for reference.
 * Note: generated render; DESIGN §12 asks for real photography before launch.
 */
export const heroStill: ImageAsset = {
  src: "hero-still-02",
  width: 1920,
  height: 1176,
  alt: { nl: "Witte woning in daglicht, op de achtergrond de stad", en: "A white house in daylight, the city skyline behind it" },
};

/**
 * Intro sequence (homepage preloader): 14 small interior details that converge into one line before the hero
 * still grows to full screen. Details, materials and light only, nothing traceable to an address (PRD §6.2).
 */
const intro = (src: string, width: number, height: number, nl: string, en: string): ImageAsset => ({ src, width, height, alt: { nl, en } });
export const introSequence: ImageAsset[] = [
  intro("intro-attic-01", 2160, 1440, "Zolder in vernieuwing", "An attic being renewed"),
  intro("intro-tap-01", 1333, 2000, "Kraan en ronde spiegel", "A tap and a round mirror"),
  intro("intro-doors-01", 2160, 1440, "Witte deuren in een gang", "White doors in a corridor"),
  intro("intro-tap-02", 1440, 2160, "Kraan boven een stenen blad", "A tap above a stone worktop"),
  intro("intro-basin-01", 1440, 2160, "Licht op een wastafel", "Light on a basin"),
  intro("intro-room-01", 4032, 3024, "Lege vernieuwde kamer", "An empty renewed room"),
  intro("intro-stone-01", 1440, 2160, "Natuursteen in een douche", "Natural stone in a shower"),
  intro("intro-stone-02", 2160, 1440, "Stenen wastafel en spiegel", "A stone basin and mirror"),
  intro("intro-wood-01", 2160, 1440, "Houten lamellen naast een wand", "Wooden slats beside a wall"),
  intro("intro-attic-02", 2160, 1440, "Nok van een zolder", "The ridge of an attic"),
  intro("intro-corridor-01", 3000, 2000, "Gang met daglicht", "A corridor in daylight"),
  intro("intro-entrance-01", 2153, 1440, "Entree met houten lamellen", "An entrance with wooden slats"),
  intro("intro-room-02", 2160, 1440, "Lichte kamer met houten vloer", "A light room with a wooden floor"),
  intro("intro-stair-01", 2160, 1440, "Trap in daglicht", "A stair in daylight"),
];

/**
 * Hero film (supplied 2026-09-29, re-supplied 2026-09-30 for the concept): 10 s, the house renewed from shell
 * to finished, same composition as the still. Re-encoded without metadata by scripts/film-export.swift.
 * WebM pending (no ffmpeg on the build machine). Note: generated render; DESIGN §12 asks for real film.
 */
export const heroFilm: VideoAsset = {
  webm: null,
  mp4: "/media/hero-film-02.mp4",
  mp4Mobile: "/media/hero-film-02-720.mp4",
  poster: heroStill,
  loop: false,
  rate: 1.5, // owner asked for a slightly faster renewal (2026-09-30)
};

/**
 * Shelf section (concept 2026-09-30). The shelf is a transparent cut-out; each icon has its compartment as a
 * centre point and width in % of the shelf image. Icons supplied at 90 px are placeholders until the final
 * assets arrive (they will need ≥ 512 px).
 */
export type ShelfIconAsset = ImageAsset & { slot: { x: number; y: number; w: number } };
export const shelfImage: ImageAsset = { src: "shelf-01", width: 968, height: 695, alt: { nl: "Open kast met boeken en objecten", en: "An open shelf with books and objects" } };
export const shelfIcons: Record<"bulb" | "hammer" | "clipboard" | "chart", ShelfIconAsset> = {
  bulb: { src: "icon-bulb-01", width: 90, height: 90, alt: { nl: "Idee: lamp met een huis", en: "Idea: a bulb with a house" }, slot: { x: 10.2, y: 63.5, w: 11 } },
  hammer: { src: "icon-hammer-01", width: 90, height: 90, alt: { nl: "Vernieuwen: hamer en bouwstenen", en: "Renewing: a hammer and building blocks" }, slot: { x: 62, y: 79, w: 12 } },
  clipboard: { src: "icon-clipboard-01", width: 90, height: 90, alt: { nl: "Beheren: checklist met een huis", en: "Managing: a checklist with a house" }, slot: { x: 28, y: 81.5, w: 13.5 } },
  chart: { src: "icon-chart-01", width: 90, height: 90, alt: { nl: "Waarde: stijgende grafiek", en: "Value: a rising chart" }, slot: { x: 85.4, y: 82, w: 13.5 } },
};

/**
 * Steps section: one looping clip per step (supplied 2026-10-02, 4 s each, canal house on a flat ground that the
 * panel feathers away), re-encoded without metadata by scripts/film-export.swift; posters are their first frames.
 */
const stepFilm = (n: string, nl: string, en: string): VideoAsset => ({
  webm: null,
  mp4: `/media/step-film-${n}.mp4`,
  mp4Mobile: `/media/step-film-${n}-720.mp4`,
  poster: { src: `step-poster-${n}`, width: 1280, height: 960, alt: { nl, en } },
  loop: true,
});
export const stepsFilms: VideoAsset[] = [
  stepFilm("01", "Grachtenpand met een kleine inspectierobot", "A canal house with a small survey robot"),
  stepFilm("02", "Grachtenpand in de steigers, gevel wordt vernieuwd", "A canal house in scaffolding, its front being renewed"),
  stepFilm("03", "Vernieuwd grachtenpand met verlichte ramen", "A renewed canal house with lit windows"),
];
/** Line drawings cut from the owner's concept image (2026-10-01): white lines on transparent, for dark bands. */
export const stepsSketches: { left: MediaSlot; right: MediaSlot } = {
  left: { id: "sketch-01", ratio: "1/1", image: { src: "sketch-house-01", width: 470, height: 470, alpha: true, alt: { nl: "Lijntekening van een grachtenpand", en: "Line drawing of a canal house" } } },
  right: { id: "sketch-02", ratio: "1/1", image: { src: "sketch-block-01", width: 500, height: 500, alpha: true, alt: { nl: "Lijntekening van een modern woongebouw", en: "Line drawing of a modern apartment building" } } },
};

/** Sky band background (owner concept 2026-10-01): canal-house gables against a morning sky. Generated render. */
export const skyImage: ImageAsset = { src: "sky-gables-01", width: 1672, height: 941, alt: { nl: "Gevels tegen een ochtendlucht", en: "Gables against a morning sky" } };

/** Footer: the same two line drawings in ink, for the Stone footer band. */
export const footerSketches: { left: ImageAsset; right: ImageAsset } = {
  left: { src: "sketch-house-ink-01", width: 470, height: 470, alpha: true, alt: { nl: "Lijntekening van een grachtenpand", en: "Line drawing of a canal house" } },
  right: { src: "sketch-block-ink-01", width: 500, height: 500, alpha: true, alt: { nl: "Lijntekening van een modern woongebouw", en: "Line drawing of a modern apartment building" } },
};

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
