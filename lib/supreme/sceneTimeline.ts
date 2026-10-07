/**
 * The transformation of the About band's model (SCENE-3D.md §3): one existing building → its potential → eight
 * apartment volumes → eight homes → one property, eight homes. One deterministic timeline over a plain state object;
 * the timeline runs from 0 to 1 (scroll progress, scrubbed by ScrollTrigger) and every scene component reads the state
 * each frame and sets its own transforms and materials from it, so nothing re-renders while scrolling.
 */

export type SceneState = {
  /** Scroll progress through the band, 0–1. */
  progress: number;
  /** 02 potential: the analysis lines around the building, the dimensions, the elevation sheet. */
  lines: number;
  dims: number;
  elevation: number;
  /** 02: the façades turn see-through; the structure (core, floors) and the eight units show inside as ghosts. */
  xray: number;
  structure: number;
  units: number;
  /** 03 redevelop: the shell opens (back, sides, roof) and the front folds down; the eight units separate. */
  openShell: number;
  openFront: number;
  oldWindows: number;
  plan: number;
  split: number;
  numbers: number;
  /** 04 homes, staggered unit by unit (01 → 08): the volumes open into rooms, then the interiors, then the light. */
  homes: number;
  interior: number;
  lights: number;
  clean: number;
  newWindows: number;
  /** 05 value: the units come back together, warm light, the overlays go, the units shown linked, trees grown. */
  warm: number;
  overlays: number;
  connect: number;
  trees: number;
  /** The mascot: its entrance, then its walk from spot to spot (0–4, one spot and pose per stage). */
  enter: number;
  walk: number;
};

export const createSceneState = (): SceneState => ({
  progress: 0,
  lines: 0,
  dims: 0,
  elevation: 0,
  xray: 0,
  structure: 0,
  units: 0,
  openShell: 0,
  openFront: 0,
  oldWindows: 1,
  plan: 0,
  split: 0,
  numbers: 0,
  homes: 0,
  interior: 0,
  lights: 0,
  clean: 0,
  newWindows: 0,
  warm: 0,
  overlays: 1,
  connect: 0,
  trees: 0.55,
  enter: 0,
  walk: 0,
});

/** Where each of the five stages sits on the timeline (and where its text is read). */
export const STAGES = [0, 0.15, 0.38, 0.6, 0.85] as const;
/** Where the closing line ("One property. Eight homes.") comes in. */
export const FINALE = 0.95;

/** Adds the transformation to a timeline whose total duration is 1 (positions are progress). */
export function buildSceneTimeline(state: SceneState, tl: GSAPTimeline) {
  const to = (vars: Partial<SceneState>, at: number, duration: number, ease = "power2.inOut") => tl.to(state, { ...vars, duration, ease }, at);

  // 01 existing: the mascot walks onto the worktable and looks the building over
  to({ enter: 1 }, 0, 0.06, "power2.out");
  // 02 potential: it goes to the drawing; the analysis draws on; the façades go see-through and show what is inside
  to({ walk: 1 }, 0.06, 0.06);
  to({ lines: 1 }, 0.11, 0.12, "power1.inOut");
  to({ dims: 1 }, 0.14, 0.1, "power1.inOut");
  to({ elevation: 1 }, 0.1, 0.12, "power1.inOut");
  to({ xray: 1 }, 0.15, 0.08);
  to({ structure: 1 }, 0.18, 0.08);
  to({ units: 1 }, 0.21, 0.08);
  // 03 redevelop: the shell opens, the front folds down, the eight separate around the core and are numbered
  to({ walk: 2 }, 0.27, 0.07);
  to({ openShell: 1, openFront: 1, xray: 0 }, 0.27, 0.1);
  to({ oldWindows: 0 }, 0.27, 0.06, "none");
  to({ plan: 1 }, 0.28, 0.12, "power1.inOut");
  to({ split: 1 }, 0.31, 0.09);
  to({ numbers: 1 }, 0.35, 0.06);
  // 04 homes: unit by unit, the volume opens into rooms (floor, walls, kitchen, bathroom, windows), then the
  // furniture, then warm light; the brick is cleaned and the new windows go in
  to({ walk: 3 }, 0.46, 0.07);
  to({ homes: 1 }, 0.44, 0.14, "power1.inOut");
  to({ interior: 1 }, 0.52, 0.12, "power1.inOut");
  to({ lights: 1 }, 0.6, 0.12, "power1.inOut");
  to({ clean: 1 }, 0.56, 0.12, "none");
  to({ newWindows: 1 }, 0.6, 0.1);
  to({ lines: 0, dims: 0, plan: 0.35, elevation: 0.6 }, 0.62, 0.1, "power1.in");
  // 05 value: the eight come back together into one building (the front stays down, so the homes stay in view),
  // shown linked through the core; warm light, the overlays go, the trees grow
  to({ walk: 4 }, 0.72, 0.08);
  to({ split: 0 }, 0.7, 0.1);
  to({ openShell: 0 }, 0.73, 0.1);
  to({ numbers: 0.6 }, 0.78, 0.06);
  to({ overlays: 0 }, 0.76, 0.08, "none");
  to({ connect: 1 }, 0.8, 0.09, "power1.inOut");
  to({ warm: 1 }, 0.78, 0.14, "power1.inOut");
  to({ trees: 1 }, 0.8, 0.12, "power2.out");
  // a still moment at the end
  tl.to({}, { duration: 0.02 }, 0.98);
  return tl;
}

/** Linear interpolation and clamp, used by the scene components. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** One unit's share of a value that runs through all eight in turn (01 first, 08 last). */
export const staggered = (v: number, i: number, n = 8, spread = 0.55) => clamp01((v - (i / n) * spread) / (1 - spread));
