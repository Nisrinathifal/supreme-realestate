"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Registers GSAP plugins and the DESIGN §3.4 easings once (client only). */
export function setupGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create("brand", ".2,.7,.2,1"); // --ease
  CustomEase.create("precise", ".65,0,.35,1"); // --ease-precise
  registered = true;
}

export const ease = {
  brand: "brand",
  precise: "precise",
  out: "power3.out", // entrances
  inOut: "power2.inOut", // scrubbed transforms (REFERENCE §9: precise and slow)
} as const;

export const MQ = {
  full: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 768px)",
} as const;

/** Reads a CSS custom property in px from an element (falls back to a default). */
export function cssPx(el: Element, name: string, fallback: number): number {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;

export const saveData = () => {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(c?.saveData);
};

export { gsap, ScrollTrigger };
