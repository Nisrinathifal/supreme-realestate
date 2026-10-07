/**
 * The camera of the About band's model (SCENE-3D.md §3): one keyframe per stage plus a pull-back for the closing line,
 * sampled on a Catmull-Rom path at the scroll progress, so the move is continuous (push in, orbit, rise, pull back)
 * with no stops. `shift` frames the model to one side of the view (the stage text sits on the other): +1 = the model
 * on the right, 0 = centred (under the closing line).
 */
import { CatmullRomCurve3, Vector3 } from "three";

type Key = { at: number; pos: [number, number, number]; target: [number, number, number]; fov: number; shift: number };

export const CAMERA_KEYS: Key[] = [
  { at: 0, pos: [48, 32, 64], target: [1, 7.5, 1], fov: 26, shift: 0.3 }, // 01 wide, high three-quarter
  { at: 0.15, pos: [-30, 30, 62], target: [3, 8.5, 1], fov: 25, shift: -0.3 }, // 02 round to the front left, the sheet in view
  { at: 0.38, pos: [41, 41, 70], target: [1, 10, 2], fov: 30, shift: 0.3 }, // 03 up and wide: the eight apart
  { at: 0.6, pos: [-26, 28, 60], target: [1, 8.5, 3], fov: 30, shift: -0.3 }, // 04 in on the homes
  { at: 0.85, pos: [30, 24, 56], target: [1, 7.5, 3], fov: 28, shift: 0.3 }, // 05 one building again
  { at: 1, pos: [40, 30, 80], target: [1, 10, 4], fov: 26, shift: 0 }, // the pull-back under the closing line
];

const posCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.pos)), false, "centripetal");
const targetCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.target)), false, "centripetal");

const smooth = (t: number) => t * t * (3 - 2 * t);

/** The segment (key index) and how far through it progress p is. */
function segment(p: number) {
  const n = CAMERA_KEYS.length - 1;
  let i = 0;
  while (i < n - 1 && p >= CAMERA_KEYS[i + 1].at) i++;
  const a = CAMERA_KEYS[i].at;
  const b = CAMERA_KEYS[i + 1].at;
  return { i, f: Math.min(1, Math.max(0, (p - a) / (b - a))) };
}

/**
 * A scalar between neighbouring keys, eased. `window` limits the change to part of the segment: the side the model
 * is framed on holds, then swaps while the stage text swaps (≈ two thirds in).
 */
const SWAP: [number, number] = [0.5, 0.82];
function scalar(p: number, pick: (k: Key) => number, window: [number, number] = [0, 1]) {
  const { i, f } = segment(p);
  const w = Math.min(1, Math.max(0, (f - window[0]) / (window[1] - window[0])));
  return pick(CAMERA_KEYS[i]) + (pick(CAMERA_KEYS[i + 1]) - pick(CAMERA_KEYS[i])) * smooth(w);
}

export function sampleCamera(p: number, pos: Vector3, target: Vector3) {
  const t = Math.min(1, Math.max(0, p));
  // the curves are parameterised by key index; map the progress onto it, so each key is reached at its own `at`
  const { i, f } = segment(t);
  const u = (i + f) / (CAMERA_KEYS.length - 1);
  posCurve.getPoint(u, pos);
  targetCurve.getPoint(u, target);
  return { fov: scalar(t, (k) => k.fov), shift: scalar(t, (k) => k.shift, SWAP) };
}
