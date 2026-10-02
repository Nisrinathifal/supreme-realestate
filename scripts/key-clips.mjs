/**
 * Keys the flat or vignetted ground of a rendered clip to transparency and joins the frames into animated WebP
 * (used for the three step clips, 2026-10-02). Frames first: `swiftc` the AVFoundation extractor or any tool that
 * writes f000.png … per frame (24 fps assumed for the frame delay).
 *
 *   node scripts/key-clips.mjs <framesDir> <outPrefix> [--test]
 *   → <outPrefix>-frames/fNNN.png (keyed RGBA frames) and <outPrefix>-poster.png (keyed first frame);
 *     with --webp also <outPrefix>.webp and <outPrefix>-720.webp (animated WebP: simple, but ~5 MB per 4 s clip)
 *   --test: frames 0 and 48 only, as PNG on transparent / Paper / green for checking the matte
 *
 * Method: per frame a background model (global surface fitted to the outer ring, then refined by normalized
 * convolution of the pixels that match it and connect to the border); pixels within T0 of the model are ground;
 * in the ground zone (lower part) same-hue darker pixels are the house's shadow and become black at alpha 1-s
 * (a multiply layer); only regions connected to the border are keyed, so interiors of similar tone stay opaque;
 * anti-aliased edge pixels are un-mixed from the model colour; opaque specks under 80 px are cleared.
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";

const [dir, outPrefix, ...flags] = process.argv.slice(2);
const TEST = flags.includes("--test");
const WEBP = flags.includes("--webp");
const T0 = 9, T1 = 40, SHADOW_Y = 0.82, SHADOW_TOL = 9, SMIN = 0.6, SPECK = 80;
const PAPER = [250, 250, 247];

function fitModel(data, W, H) {
  // ring: top 7%, sides 6%, bottom 3%
  const ring = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y < H * 0.07 || x < W * 0.06 || x > W * 0.94 || y > H * 0.97) ring.push(y * W + x);
  }
  const basis = (x, y) => { const u = x / W - 0.5, v = y / H - 0.5; return [1, u, v, u * u, u * v, v * v, (u * u + v * v) ** 2]; };
  const N = 7;
  const coef = [];
  for (let c = 0; c < 3; c++) {
    let use = ring;
    let w = null;
    for (let pass = 0; pass < 3; pass++) {
      const A = Array.from({ length: N }, () => new Float64Array(N));
      const b = new Float64Array(N);
      for (const i of use) {
        const x = i % W, y = (i / W) | 0;
        const f = basis(x, y), p = data[i * 4 + c];
        for (let r = 0; r < N; r++) { b[r] += f[r] * p; for (let s = 0; s < N; s++) A[r][s] += f[r] * f[s]; }
      }
      w = solve(A, b);
      // drop outliers (objects crossing the ring) for the next pass
      const next = [];
      for (const i of use) {
        const x = i % W, y = (i / W) | 0;
        const f = basis(x, y); let m = 0; for (let r = 0; r < N; r++) m += w[r] * f[r];
        if (Math.abs(data[i * 4 + c] - m) < 10) next.push(i);
      }
      use = next;
    }
    coef.push(w);
  }
  const model = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const f = basis(x, y);
    for (let c = 0; c < 3; c++) { let m = 0; for (let r = 0; r < N; r++) m += coef[c][r] * f[r]; model[(y * W + x) * 3 + c] = m; }
  }
  return model;
}
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let s = i; s <= n; s++) M[r][s] -= f * M[i][s]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

// Box blur (radius R) of a float plane, in place, separable; three passes ≈ Gaussian
function boxBlur(src, W, H, R) {
  const tmp = new Float32Array(W * H);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) {
      let sum = 0; const row = y * W;
      for (let x = -R; x <= R; x++) sum += src[row + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        tmp[row + x] = sum / (2 * R + 1);
        sum += src[row + Math.min(W - 1, x + R + 1)] - src[row + Math.max(0, x - R)];
      }
    }
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let y = -R; y <= R; y++) sum += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        src[y * W + x] = sum / (2 * R + 1);
        sum += tmp[Math.min(H - 1, y + R + 1) * W + x] - tmp[Math.max(0, y - R) * W + x];
      }
    }
  }
}
// Non-parametric background: normalized convolution of the pixels known to be ground, refined twice
function refineModel(data, W, H, model0) {
  const n = W * H;
  let model = model0;
  for (let it = 0, tol = 14; it < 3; it++, tol = 10) {
    const known = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const d = Math.max(Math.abs(data[i * 4] - model[i * 3]), Math.abs(data[i * 4 + 1] - model[i * 3 + 1]), Math.abs(data[i * 4 + 2] - model[i * 3 + 2]));
      known[i] = d < tol ? 1 : 0;
    }
    // only ground connected to the border counts (an interior patch of similar tone is not ground)
    const reach = new Uint8Array(n); const stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) { const i = stack.pop(); if (reach[i] || !known[i]) continue; reach[i] = 1; const x = i % W; if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (i >= W) stack.push(i - W); if (i + W < n) stack.push(i + W); }
    const mask = new Float32Array(n); for (let i = 0; i < n; i++) mask[i] = reach[i];
    const planes = [0, 1, 2].map((c) => { const p = new Float32Array(n); for (let i = 0; i < n; i++) p[i] = reach[i] ? data[i * 4 + c] : 0; return p; });
    boxBlur(mask, W, H, 24); planes.forEach((p) => boxBlur(p, W, H, 24));
    const next = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) next[i * 3 + c] = mask[i] > 0.03 ? planes[c][i] / mask[i] : model[i * 3 + c];
    model = next;
  }
  return model;
}

function keyFrame(data, W, H) {
  const model = refineModel(data, W, H, fitModel(data, W, H));
  const n = W * H;
  const cls = new Uint8Array(n); // 0 opaque, 1 bg core, 2 shadow
  const sval = new Float32Array(n);
  const dist = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const mr = model[i * 3], mg = model[i * 3 + 1], mb = model[i * 3 + 2];
    const d = Math.max(Math.abs(r - mr), Math.abs(g - mg), Math.abs(b - mb));
    dist[i] = d;
    if (d < T0) { cls[i] = 1; continue; }
    const y = (i / W) | 0;
    if (y > H * SHADOW_Y && r <= mr + 3 && g <= mg + 3 && b <= mb + 3) {
      const s = (r + g + b) / (mr + mg + mb);
      if (s >= SMIN && Math.abs(r - mr * s) <= SHADOW_TOL && Math.abs(g - mg * s) <= SHADOW_TOL && Math.abs(b - mb * s) <= SHADOW_TOL) { cls[i] = 2; sval[i] = s; }
    }
  }
  // connectivity from the border
  const reach = new Uint8Array(n);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (reach[i] || !cls[i]) continue;
    reach[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i + W < n) stack.push(i + W);
  }
  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const x = i % W;
    // ground: alpha 0, the original colour kept underneath (a video export subsamples chroma: no dark fringe)
    if (reach[i] && cls[i] === 1) { out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 0; continue; }
    if (reach[i] && cls[i] === 2) { out[i * 4 + 3] = Math.round(255 * Math.min(1, (1 - sval[i]) * 1.1)); continue; } // black shadow
    // opaque pixel: soften if it touches a keyed neighbour (anti-aliased edge), un-mix from the model colour
    let edge = false;
    if (x > 0 && reach[i - 1]) edge = true; else if (x < W - 1 && reach[i + 1]) edge = true;
    else if (i >= W && reach[i - W]) edge = true; else if (i + W < n && reach[i + W]) edge = true;
    let a = 1;
    if (edge) a = Math.min(1, Math.max(0.15, (dist[i] - T0) / (T1 - T0)));
    const mr = model[i * 3], mg = model[i * 3 + 1], mb = model[i * 3 + 2];
    const un = (p, m) => Math.max(0, Math.min(255, Math.round((p - m * (1 - a)) / a)));
    out[i * 4] = a < 1 ? un(r, mr) : r; out[i * 4 + 1] = a < 1 ? un(g, mg) : g; out[i * 4 + 2] = a < 1 ? un(b, mb) : b;
    out[i * 4 + 3] = Math.round(a * 255);
  }
  // specks: opaque islands smaller than SPECK px (dust in the render) are cleared
  const seen = new Uint8Array(n);
  for (let s0 = 0; s0 < n; s0++) {
    if (seen[s0] || out[s0 * 4 + 3] === 0) continue;
    const comp = []; const st = [s0]; seen[s0] = 1;
    while (st.length) {
      const i = st.pop(); comp.push(i);
      const x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i + W < n ? i + W : -1]) {
        if (j >= 0 && !seen[j] && out[j * 4 + 3] !== 0) { seen[j] = 1; st.push(j); }
      }
      if (comp.length > SPECK) { /* big enough: drain without collecting further */ }
    }
    if (comp.length <= SPECK) for (const i of comp) out[i * 4 + 3] = 0;
  }
  return out;
}

const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
const list = TEST ? [files[0], files[48]] : files;
const frames = [];
let W, H;
for (const f of list) {
  const { data, info } = await sharp(`${dir}/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  W = info.width; H = info.height;
  const keyed = keyFrame(data, W, H);
  if (TEST) { frames.push(keyed); continue; }
  // keyed frames as PNG: written to <outPrefix>-frames/ for the stacked-video export (scripts/film-stack.swift)
  const png = await sharp(keyed, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 1 }).toBuffer();
  mkdirSync(`${outPrefix}-frames`, { recursive: true });
  writeFileSync(`${outPrefix}-frames/${f}`, png);
  if (WEBP) frames.push(png);
}
if (TEST) {
  for (let k = 0; k < frames.length; k++) {
    const img = sharp(frames[k], { raw: { width: W, height: H, channels: 4 } });
    await img.clone().png().toFile(`${outPrefix}-${k}.png`);
    await img.clone().flatten({ background: { r: PAPER[0], g: PAPER[1], b: PAPER[2] } }).png().toFile(`${outPrefix}-${k}-paper.png`);
    await img.clone().flatten({ background: { r: 120, g: 160, b: 120 } }).png().toFile(`${outPrefix}-${k}-green.png`);
  }
  console.log("test done", W, H);
} else if (!WEBP) {
  await sharp(`${outPrefix}-frames/${list[0]}`).png().toFile(`${outPrefix}-poster.png`);
  console.log("done", list.length, "keyed frames →", `${outPrefix}-frames/`);
} else {
  const delay = list.map((_, i) => (i % 3 === 0 ? 42 : 41)); // 24 fps ≈ 41.67 ms
  const anim = (fr) => sharp(fr, { join: { animated: true } }).webp({ quality: 80, alphaQuality: 90, effort: 5, loop: 0, delay, minSize: true });
  await anim(frames).toFile(`${outPrefix}.webp`);
  // phone size: the keyed frames scaled to 720 wide
  const small = [];
  for (const fr of frames) small.push(await sharp(fr).resize(720).png({ compressionLevel: 1 }).toBuffer());
  await anim(small).toFile(`${outPrefix}-720.webp`);
  await sharp(frames[0]).png().toFile(`${outPrefix}-poster.png`);
  console.log("done", list.length, "frames →", `${outPrefix}.webp`);
}
