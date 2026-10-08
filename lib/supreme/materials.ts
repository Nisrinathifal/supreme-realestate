/**
 * Colours and procedural textures of the About band's model (SCENE-3D.md). Colours come from styles/tokens.css, read
 * once at runtime; textures are drawn on small canvases with a seeded random, so the scene looks the same on every
 * load. No image, model or font is fetched.
 */
import { CanvasTexture, Color, DataTexture, LineBasicMaterial, type MeshToonMaterialParameters, MeshToonMaterial, NearestFilter, RedFormat, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/** Seeded pseudo-random (mulberry32): deterministic textures. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOKENS = ["--bg", "--alt", "--line", "--ink", "--muted", "--accent", "--window-light", "--band-dark", "--inv-surface", "--scene-brick", "--scene-brick-old", "--scene-oak", "--scene-teal", "--scene-concrete", "--scene-graphite", "--scene-draw"] as const;
export type Token = (typeof TOKENS)[number];

let palette: Record<Token, string> | null = null;
/** The token values as CSS colour strings (read once, from :root, so band remappings never leak in). */
export function tokens(): Record<Token, string> {
  if (palette) return palette;
  const cs = getComputedStyle(document.documentElement);
  palette = Object.fromEntries(TOKENS.map((t) => [t, cs.getPropertyValue(t).trim() || "#888888"])) as Record<Token, string>;
  return palette;
}
export const color = (t: Token) => new Color(tokens()[t]);

function canvas(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]): Texture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  draw(g, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

const cache = new Map<string, Texture>();
const once = (key: string, make: () => Texture) => {
  let t = cache.get(key);
  if (!t) cache.set(key, (t = make()));
  return t;
};

/** Paper: a fine grain and a few fibres, as a greyscale mask (the material's token colour tints it). */
export const paperTexture = () =>
  once("paper", () =>
    canvas(
      512,
      (g, s) => {
        const r = rng(7);
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, s, s);
        const img = g.getImageData(0, 0, s, s);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = 255 - r() * 14;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        }
        g.putImageData(img, 0, 0);
        g.strokeStyle = "rgba(0,0,0,0.035)";
        for (let i = 0; i < 90; i++) {
          g.beginPath();
          const x = r() * s, y = r() * s, a = r() * Math.PI;
          g.moveTo(x, y);
          g.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18);
          g.stroke();
        }
      },
      [6, 6],
    ),
  );

/** Brick: running bond, slight variation per brick, light mortar. Greyscale, tinted by the material colour. */
export const brickTexture = () =>
  once("brick", () =>
    canvas(
      512,
      (g, s) => {
        const r = rng(11);
        const rows = 16;
        const bh = s / rows;
        const bw = bh * 2.2;
        g.fillStyle = "#e9e6e1"; // mortar
        g.fillRect(0, 0, s, s);
        for (let y = 0; y < rows; y++) {
          const off = y % 2 ? bw / 2 : 0;
          for (let x = -bw; x < s + bw; x += bw) {
            const v = 175 + Math.floor(r() * 50);
            g.fillStyle = `rgb(${v},${v},${v})`;
            g.fillRect(x + off + 2, y * bh + 2, bw - 4, bh - 4);
          }
        }
      },
      [2, 4],
    ),
  );

/** Oak: long boards with soft grain. Greyscale, tinted by the material colour. */
export const woodTexture = () =>
  once("wood", () =>
    canvas(
      512,
      (g, s) => {
        const r = rng(23);
        const boards = 8;
        const bw = s / boards;
        for (let b = 0; b < boards; b++) {
          const base = 200 + Math.floor(r() * 30);
          g.fillStyle = `rgb(${base},${base},${base})`;
          g.fillRect(b * bw, 0, bw, s);
          g.strokeStyle = "rgba(0,0,0,0.07)";
          for (let k = 0; k < 9; k++) {
            g.beginPath();
            const x = b * bw + r() * bw;
            g.moveTo(x, 0);
            for (let y = 0; y <= s; y += 32) g.lineTo(x + Math.sin(y / 60 + k) * 3, y);
            g.stroke();
          }
          g.fillStyle = "rgba(0,0,0,0.12)";
          g.fillRect(b * bw, 0, 1.5, s);
        }
      },
      [2, 2],
    ),
  );

/** Concrete: a very soft mottle. */
export const concreteTexture = () =>
  once("concrete", () =>
    canvas(
      256,
      (g, s) => {
        const r = rng(31);
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, s, s);
        for (let i = 0; i < 260; i++) {
          g.fillStyle = `rgba(0,0,0,${0.015 + r() * 0.02})`;
          g.beginPath();
          g.arc(r() * s, r() * s, 2 + r() * 10, 0, Math.PI * 2);
          g.fill();
        }
      },
      [2, 2],
    ),
  );

/** A ruler's ticks and numbers. */
export const rulerTexture = () =>
  once("ruler", () =>
    canvas(512, (g, s) => {
      g.fillStyle = tokens()["--bg"];
      g.fillRect(0, 0, s, s);
      g.strokeStyle = tokens()["--scene-graphite"];
      g.fillStyle = tokens()["--scene-graphite"];
      g.font = `20px ${fontFamily()}`;
      for (let i = 0; i <= 50; i++) {
        const x = 8 + i * ((s - 16) / 50);
        const h = i % 10 === 0 ? 60 : i % 5 === 0 ? 40 : 22;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.lineWidth = 2;
        g.stroke();
        if (i % 10 === 0) g.fillText(String(i / 10), x + 4, 84);
      }
    }),
  );

/** A typed document: a heading bar and lines of text. */
export const documentTexture = (seed: number) =>
  once(`doc-${seed}`, () =>
    canvas(256, (g, s) => {
      const r = rng(seed);
      g.fillStyle = tokens()["--bg"];
      g.fillRect(0, 0, s, s);
      g.fillStyle = tokens()["--ink"];
      g.globalAlpha = 0.55;
      g.fillRect(24, 26, 90, 9);
      g.globalAlpha = 0.22;
      for (let y = 56; y < s - 24; y += 13) g.fillRect(24, y, 120 + r() * 90, 4);
      g.globalAlpha = 1;
    }),
  );

/** The family of the page's body font (next/font), so labels drawn on canvas match the site. */
export function fontFamily() {
  if (typeof document === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/** A text label on a transparent canvas, for drawing annotations ("+12.00"). Returns the texture and its aspect. */
export function labelTexture(text: string, colorToken: Token = "--scene-graphite") {
  const key = `label-${colorToken}-${text}`;
  const cached = cache.get(key);
  const h = 64;
  const font = `500 ${h * 0.62}px ${fontFamily()}`;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width) + 16;
  if (cached) return { texture: cached, aspect: w / h };
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.font = font;
  g.fillStyle = tokens()[colorToken];
  g.textBaseline = "middle";
  g.fillText(text, 8, h / 2);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  cache.set(key, tex);
  return { texture: tex as Texture, aspect: w / h };
}

/** A soft round contact shadow (black, fading out), for a cut-out standing on the table. */
export const contactShadowTexture = () =>
  once("contact", () =>
    canvas(128, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.18)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }),
  );

/**
 * The scene's shading, after illoca.unseen.co (owner, 2026-10-08): flat, stepped light (five steps, no gradients)
 * on every surface, like a drawn architectural illustration, with hard cast shadows and drawn edges (edgeMaterial).
 * One gradient map for all materials.
 */
let steps: DataTexture | null = null;
export function toonSteps() {
  if (steps) return steps;
  const data = new Uint8Array([40, 90, 140, 195, 255]); // five steps, shade (the sky light alone) to light, as illoca's frames show four to five tones
  steps = new DataTexture(data, 5, 1, RedFormat);
  steps.minFilter = steps.magFilter = NearestFilter;
  steps.generateMipmaps = false;
  steps.needsUpdate = true;
  return steps;
}
/** A surface of the scene: toon shaded with the shared steps. */
export const toon = (params: MeshToonMaterialParameters = {}) => new MeshToonMaterial({ gradientMap: toonSteps(), ...params });
export type SceneMaterial = MeshToonMaterial;

/** The drawn edges of the building's parts: thin graphite lines (EdgesGeometry), shared and faded by the scene. */
let edges: LineBasicMaterial | null = null;
export const edgeMaterial = () => (edges ??= new LineBasicMaterial({ color: tokens()["--scene-graphite"], transparent: true, opacity: 0.55, depthWrite: false }));
