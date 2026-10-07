/**
 * The camera of the About band's model (SCENE-3D.md §3): six keyframes, one per state, sampled on a Catmull-Rom path
 * at the scroll progress, so the move is continuous (push in, orbit, tilt, pull back) with no stops. `shift` frames
 * the model to one side of the view (the stage text sits on the other): +1 = the model on the right.
 */
import { CatmullRomCurve3, Vector3 } from "three";

type Key = { pos: [number, number, number]; target: [number, number, number]; fov: number; shift: number };

export const CAMERA_KEYS: Key[] = [
  { pos: [44, 36, 58], target: [0, 7.5, 0], fov: 26, shift: 0.3 }, // 01 wide, high three-quarter
  { pos: [-38, 31, 52], target: [0, 8.5, 0], fov: 25, shift: -0.3 }, // 02 orbit left, in a little
  { pos: [-48, 27, 34], target: [0, 9.5, 2], fov: 26, shift: 0.3 }, // 03 round to the open side
  { pos: [-27, 27, 50], target: [0, 8, 3], fov: 28, shift: -0.3 }, // 04 in on the floors
  { pos: [32, 27, 42], target: [0, 8.5, 1], fov: 27, shift: 0.3 }, // 05 rises, settles
  { pos: [50, 35, 64], target: [0, 7.5, 0], fov: 24, shift: -0.28 }, // 06 pulls back
];

const posCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.pos)), false, "centripetal");
const targetCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.target)), false, "centripetal");

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Scalar keyframe values at progress p, eased between neighbours. `window` limits the change to part of each
 * segment: the side the model is framed on holds, then swaps while the stage text swaps (≈ two thirds in).
 */
const SWAP: [number, number] = [0.5, 0.82];
function scalar(p: number, pick: (k: Key) => number, window: [number, number] = [0, 1]) {
  const n = CAMERA_KEYS.length - 1;
  const x = Math.min(n, Math.max(0, p * n));
  const i = Math.min(n - 1, Math.floor(x));
  const f = Math.min(1, Math.max(0, (x - i - window[0]) / (window[1] - window[0])));
  return pick(CAMERA_KEYS[i]) + (pick(CAMERA_KEYS[i + 1]) - pick(CAMERA_KEYS[i])) * smooth(f);
}

export function sampleCamera(p: number, pos: Vector3, target: Vector3) {
  const t = Math.min(1, Math.max(0, p));
  posCurve.getPoint(t, pos);
  targetCurve.getPoint(t, target);
  return { fov: scalar(t, (k) => k.fov), shift: scalar(t, (k) => k.shift, SWAP) };
}
