// Supreme Real Estate logo: geometry + lockups. Pure functions, no dependencies.
// Used by tools/build.mjs (files) and inlined into index.html (recolour tool).
//
// Two mark shapes on the same 30° isometric grid, sharing the wordmark and lockups:
//   roof  (A, concept "Geometry grid + Property + Flow + Roof"): roof chevron, a second chevron whose
//         left arm folds back into the upper S, and the lower S stroke. One band thickness `t`, gap `g`.
//   cube  (B, concept "Letter S + Property + Structure"): an S cut from an isometric cube silhouette;
//         S faces in the S colour, roof/structure faces (top-right arm, right wall, underside) in the roof colour.

const S30 = Math.tan(Math.PI / 6);

export const ROOF = { H: 100, t: 34, g: 22, xOut: -88, E: 25, rEnd: 9, rTip: 2 };

const f = (n) => +n.toFixed(2);

/** Polygon → path, rounding the corners that have a radius (quadratic corner). */
function roundPoly(pts, radii = []) {
  const n = pts.length;
  const cmds = [];
  for (let i = 0; i < n; i++) {
    const P = pts[i], A = pts[(i - 1 + n) % n], B = pts[(i + 1) % n];
    const r = radii[i] || 0;
    if (!r) { cmds.push(["L", P]); continue; }
    const la = Math.hypot(A[0] - P[0], A[1] - P[1]), lb = Math.hypot(B[0] - P[0], B[1] - P[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const a = [P[0] + ((A[0] - P[0]) / la) * rr, P[1] + ((A[1] - P[1]) / la) * rr];
    const b = [P[0] + ((B[0] - P[0]) / lb) * rr, P[1] + ((B[1] - P[1]) / lb) * rr];
    cmds.push(["L", a], ["Q", P, b]);
  }
  cmds[0][0] = "M";
  return cmds.map(([c, p, q]) => c + f(p[0]) + " " + f(p[1]) + (q ? " " + f(q[0]) + " " + f(q[1]) : "")).join("") + "Z";
}

/** Mark A: bands as path data, in a box starting at (0,0). */
function roofMark(geo = ROOF) {
  const { H, t, g, xOut, E, rEnd, rTip } = geo;
  const s = S30;
  const y0 = t + g;                 // band 2 apex
  const c = y0 - 2 * s * xOut;      // band 2 fold: lower-arm outer edge y = c + s·x
  const xIn = xOut + t / s;         // inner fold vertex
  const yV = y0 - s * xOut;         // both fold vertices sit at this height
  const d = c + g;                  // band 3 top edge y = d + s·x
  const sh = (pts) => pts.map(([x, y]) => [x + H, y]);

  const band1 = [[0, 0], [H, s * H], [H, s * H + t], [0, t], [-H, s * H + t], [-H, s * H]];
  const band2 = [[0, y0], [H, y0 + s * H], [H, y0 + t + s * H], [0, y0 + t], [xIn, yV], [E, c - t + s * E], [E, c + s * E], [xOut, yV]];
  const radii2 = [0, 0, 0, 0, rTip, rEnd, rEnd, rTip];
  const sLeft = [[0, y0], [0, y0 + t], [xIn, yV], [E, c - t + s * E], [E, c + s * E], [xOut, yV]];
  const roofRight = [[0, y0], [H, y0 + s * H], [H, y0 + t + s * H], [0, y0 + t]];
  const band3 = [[-H, d - s * H], [E, d + s * E], [E, d + t + s * E], [-H, d + t - s * H]];

  const p = {
    band1: roundPoly(sh(band1)),
    band2: roundPoly(sh(band2), radii2),
    band2S: roundPoly(sh(sLeft), [0, 0, rTip, rEnd, rEnd, rTip]),
    band2Roof: roundPoly(sh(roofRight)),
    band3: roundPoly(sh(band3), [0, rEnd, rEnd, 0]),
  };
  return {
    width: 2 * H,
    height: f(d + t + s * E),
    // gradient style (concept render): S colour → roof colour across the apex of band 2
    gradients: { main: { x1: f(H - 6), y1: 0, x2: f(H + 48), y2: 0, stops: [[0, "s"], [1, "roof"]] } },
    draw(style, gid, C) {
      const band2 =
        style === "gradient"
          ? `<path fill="url(#${gid("main")})" d="${p.band2}"/>`
          : style === "mono"
            ? `<path class="${C.s}" d="${p.band2}"/>`
            : `<path class="${C.s}" d="${p.band2S}"/><path class="${C.roof}" d="${p.band2Roof}"/>`;
      return `<path class="${C.roof}" d="${p.band1}"/>${band2}<path class="${C.s}" d="${p.band3}"/>`;
    },
  };
}

export const CUBE = { H: 100, a: 45, xv: -43, tb: 31, face: 32, tBlock: 36, x1: 30, x2: 55, x3: 67 };

/** Mark B: S cut from an isometric cube (regular hexagon silhouette), in a box starting at (0,0). */
function cubeMark(geo = CUBE) {
  const { H, a, xv, tb, face, tBlock, x1, x2, x3 } = geo;
  const s = S30;
  const yB = 4 * s * H;                          // bottom apex
  const low = (x) => yB - s * Math.abs(x);       // lower silhouette edges
  const yv = a - s * xv;                          // inner fold vertex (top arm inner edge meets band)
  const top = (x) => yv + s * (x - xv);           // middle band top edge
  const bot = (x) => top(x) + tb;                 // middle band bottom edge
  const sh = (pts) => pts.map(([x, y]) => [x + H, y]);

  // S colour: top-left arm + middle band (ending in a vertical face), lower-left block
  const sBand = [[0, 0], [0, a], [xv, yv], [x2, top(x2)], [x2, low(x2)], [x1, low(x1)], [x1, bot(x1)], [-H, bot(-H)], [-H, s * H]];
  const sBlock = [[-H, low(-H) - tBlock], [0, yB - tBlock], [0, yB], [-H, low(-H)]];
  // roof colour: top-right arm + right wall ("7"), underside face of the band + its vertical face
  const roofArm = [[0, 0], [H, s * H], [H, low(H)], [x3, low(x3)], [x3, a + s * x3], [0, a]];
  const roofFace = [[-H, bot(-H)], [x1, bot(x1)], [x1, low(x1)], [0, yB], [0, bot(0) + face], [-H, bot(-H) + face]];
  const p = Object.fromEntries(Object.entries({ sBand, sBlock, roofArm, roofFace }).map(([k, v]) => [k, roundPoly(sh(v))]));

  return {
    width: 2 * H,
    height: f(yB),
    // gradient style: roof faces darken towards the S colour at the bottom, like the concept render
    gradients: { main: { x1: 0, y1: 0, x2: 0, y2: f(yB), stops: [[0, "roof"], [0.5, "roof"], [1, "s"]] } },
    draw(style, gid, C) {
      const roof = (d) =>
        style === "gradient" ? `<path fill="url(#${gid("main")})" d="${d}"/>`
          : style === "mono" ? `<path class="${C.roof}" fill-opacity="0.55" d="${d}"/>`
            : `<path class="${C.roof}" d="${d}"/>`;
      return roof(p.roofArm) + roof(p.roofFace) + `<path class="${C.s}" d="${p.sBand}"/><path class="${C.s}" d="${p.sBlock}"/>`;
    },
  };
}

export const MARKS = {
  roof: { label: "A · Roof-S", build: roofMark },
  cube: { label: "B · Cube-S", build: cubeMark },
};

/** Lay out a word from outlined glyphs. Returns {svg, width, height} with cap height = size. */
function word(glyphs, text, size, tracking, cls) {
  const k = size / 100;
  let x = 0, minX = Infinity, maxX = -Infinity;
  const parts = [];
  for (const ch of text) {
    if (ch === " ") { x += 26 + tracking / k; continue; }
    const gph = glyphs[ch];
    const xs = gph.d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 0);
    minX = Math.min(minX, x + Math.min(...xs));
    maxX = Math.max(maxX, x + Math.max(...xs));
    parts.push(`<path transform="translate(${f(x)} 0)" d="${gph.d}"/>`);
    x += gph.adv + tracking / k;
  }
  const width = (maxX - minX) * k;
  return {
    svg: (tx, ty) => `<g class="${cls}" transform="translate(${f(tx - minX * k)} ${f(ty)}) scale(${+k.toFixed(5)})">${parts.join("")}</g>`,
    width: f(width),
    height: size,
  };
}

/** Spread a word so its outline width equals `target`. */
function fitWord(glyphs, text, size, target, cls) {
  const probe = word(glyphs, text, size, 0, cls);
  const gaps = [...text].length - 1;
  return word(glyphs, text, size, (target - probe.width) / gaps, cls);
}

export const CLASSES = { roof: "sre-roof", s: "sre-s", word: "sre-word", tag: "sre-tag" };

/**
 * Build one lockup as an SVG string.
 * layout: "mark" | "stacked" | "horizontal" | "wordmark"
 * colors: { roof, s, word, tag } concrete colours, or null → CSS-variable template.
 * opts: { variant: key of MARKS, style: "flat" | "gradient" | "mono", mono: colour for mono, bg, pad: padding ratio }
 */
export function buildLogo(glyphs, layout, colors, opts = {}) {
  const style = opts.style || "flat";
  const m = MARKS[opts.variant || "roof"].build();
  const C = CLASSES;
  const gid = (name) => `sre-grad-${opts.variant || "roof"}-${layout}-${name}`;
  const tpl = !colors;
  const fallback = { roof: "#9D8574", s: "#33494A", word: "#33494A", tag: "#8A8B86" };
  const col = (key) => (style === "mono" ? (opts.mono || "currentColor") : tpl ? `var(--supreme-${key}, ${fallback[key]})` : colors[key]);

  const markSvg = (x, y, scale) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${+scale.toFixed(5)})">${m.draw(style, gid, C)}</g>`;

  let w, h, body;
  if (layout === "mark") {
    w = m.width; h = m.height;
    body = markSvg(0, 0, 1);
  } else if (layout === "stacked") {
    const markW = 200, wordW = 276;
    const sup = fitWord(glyphs.medium, "SUPREME", 28, wordW, C.word);
    const tag = fitWord(glyphs.regular, "REAL ESTATE", 10, wordW * 0.74, C.tag);
    w = wordW; const mx = (w - markW) / 2;
    const yWord = m.height + 22, yTag = yWord + sup.height + 17;
    h = yTag + tag.height;
    body = markSvg(mx, 0, 1) + sup.svg(0, yWord) + tag.svg((w - tag.width) / 2, yTag);
  } else if (layout === "horizontal") {
    const scale = 0.62, markW = 200 * scale, markH = m.height * scale;
    const sup = word(glyphs.medium, "SUPREME", markH * 0.3, markH * 0.3 * 0.42, C.word);
    const tag = fitWord(glyphs.regular, "REAL ESTATE", markH * 0.11, sup.width, C.tag);
    const gap = markH * 0.26, lineGap = sup.height * 0.62;
    const blockH = sup.height + lineGap + tag.height;
    const tx = markW + gap, ty = (markH - blockH) / 2;
    w = tx + sup.width; h = markH;
    body = markSvg(0, 0, scale) + sup.svg(tx, ty) + tag.svg(tx, ty + sup.height + lineGap);
  } else if (layout === "wordmark") {
    const sup = fitWord(glyphs.medium, "SUPREME", 28, 276, C.word);
    const tag = fitWord(glyphs.regular, "REAL ESTATE", 10, 276 * 0.74, C.tag);
    w = 276; h = sup.height + 17 + tag.height;
    body = sup.svg(0, 0) + tag.svg((w - tag.width) / 2, sup.height + 17);
  } else throw new Error("unknown layout " + layout);

  const pad = (opts.pad ?? 0) * Math.max(w, h);
  const vb = `${f(-pad)} ${f(-pad)} ${f(w + 2 * pad)} ${f(h + 2 * pad)}`;
  const stop = ([o, k, op]) => `<stop offset="${o}" style="stop-color:${k.startsWith("#") ? k : col(k)}${op == null ? "" : `;stop-opacity:${op}`}"/>`;
  const grad =
    style === "gradient"
      ? `<defs>${Object.entries(m.gradients).map(([n, gr]) => `<linearGradient id="${gid(n)}" gradientUnits="userSpaceOnUse" x1="${gr.x1}" y1="${gr.y1}" x2="${gr.x2}" y2="${gr.y2}">${gr.stops.map(stop).join("")}</linearGradient>`).join("")}</defs>`
      : "";
  const css = `<style>.${C.roof}{fill:${col("roof")}}.${C.s}{fill:${col("s")}}.${C.word}{fill:${col("word")}}.${C.tag}{fill:${col("tag")}}</style>`;
  const bg = opts.bg ? `<rect x="${f(-pad)}" y="${f(-pad)}" width="${f(w + 2 * pad)}" height="${f(h + 2 * pad)}" fill="${opts.bg}"/>` : "";
  const title = layout === "mark" ? "Supreme Real Estate mark" : "Supreme Real Estate";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${f(w + 2 * pad)}" height="${f(h + 2 * pad)}" role="img" aria-label="${title}"><title>${title}</title>${css}${grad}${bg}${body}</svg>`;
}
