/**
 * The transformation of the About band's model (SCENE-3D.md §3) as one deterministic timeline over a plain state
 * object. The timeline runs from 0 to 1 (scroll progress, scrubbed by ScrollTrigger); every scene component reads the
 * state each frame and sets its own transforms and materials from it, so nothing re-renders while scrolling.
 */

export type SceneState = {
  /** Scroll progress through the band, 0–1. */
  progress: number;
  /** 02 potential: the analysis lines around the house, the dimensions, the elevation sheet. */
  lines: number;
  dims: number;
  elevation: number;
  /** 03 redevelop: the shell opens (back, sides, roof, floors) and the front comes off; old windows go. */
  openShell: number;
  openFront: number;
  oldWindows: number;
  interiorWalls: number;
  plan: number;
  /** 04 design: the interior appears as a pale design model. */
  interior: number;
  /** 05 realisation, in order: the shell closes, new windows, floors, kitchen, light; the brick is cleaned. */
  newWindows: number;
  floorsReal: number;
  kitchenReal: number;
  lights: number;
  clean: number;
  /** 06 delivery: warm light, overlays gone, trees grown. */
  warm: number;
  overlays: number;
  trees: number;
};

export const createSceneState = (): SceneState => ({
  progress: 0,
  lines: 0,
  dims: 0,
  elevation: 0,
  openShell: 0,
  openFront: 0,
  oldWindows: 1,
  interiorWalls: 0,
  plan: 0,
  interior: 0,
  newWindows: 0,
  floorsReal: 0,
  kitchenReal: 0,
  lights: 0,
  clean: 0,
  warm: 0,
  overlays: 1,
  trees: 0.55,
});

/** Where each of the six states sits on the timeline (and where its text is read). */
export const STAGES = [0, 0.2, 0.4, 0.6, 0.8, 1] as const;

/** Adds the transformation to a timeline whose total duration is 1 (positions are progress). */
export function buildSceneTimeline(state: SceneState, tl: GSAPTimeline) {
  const to = (vars: Partial<SceneState>, at: number, duration: number, ease = "power2.inOut") => tl.to(state, { ...vars, duration, ease }, at);

  // 02 potential
  to({ lines: 1 }, 0.06, 0.14, "power1.inOut");
  to({ dims: 1 }, 0.1, 0.12, "power1.inOut");
  to({ elevation: 1 }, 0.08, 0.14, "power1.inOut");
  // 03 redevelop
  to({ openShell: 1, openFront: 1 }, 0.25, 0.15);
  to({ oldWindows: 0 }, 0.26, 0.08, "none");
  to({ interiorWalls: 1 }, 0.31, 0.09);
  to({ plan: 1 }, 0.28, 0.14, "power1.inOut");
  // 04 design
  to({ interior: 1 }, 0.45, 0.13);
  // 05 realisation: the shell closes first (the front stays off, so the interior can still be seen), then the rest
  to({ openShell: 0 }, 0.63, 0.08);
  to({ clean: 1 }, 0.63, 0.1, "none");
  to({ newWindows: 1 }, 0.69, 0.07);
  to({ floorsReal: 1 }, 0.72, 0.05);
  to({ kitchenReal: 1 }, 0.74, 0.05);
  to({ lights: 1 }, 0.76, 0.05);
  to({ lines: 0, dims: 0, plan: 0.35, elevation: 0.6 }, 0.72, 0.1, "power1.in");
  // 06 delivery: the front closes, warm light, the overlays go, the trees grow
  to({ openFront: 0 }, 0.83, 0.09);
  to({ warm: 1 }, 0.84, 0.14, "power1.inOut");
  to({ overlays: 0 }, 0.84, 0.08, "none");
  to({ trees: 1 }, 0.86, 0.12, "power2.out");
  // a still moment at the end
  tl.to({}, { duration: 0.02 }, 0.98);
  return tl;
}

/** Linear interpolation and clamp, used by the scene components. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
