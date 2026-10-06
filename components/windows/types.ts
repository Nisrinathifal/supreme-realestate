import type { ImageAsset } from "@/content/media";
import type { WindowBox } from "@/content/projects";

/** One project as the client layer gets it: resolved copy, plain strings only (built in ProjectWindows). */
export type WindowProject = {
  id: string;
  name: string;
  location: string;
  category: string;
  country: string;
  /** Accessible name of the window ("Explore Durgerdammergouw"). */
  label: string;
  preview: ImageAsset;
  interior: ImageAsset | null;
  window: WindowBox | null;
  /** The discreet headline ("Historic townhouse — Haarlem") and the line under it. */
  title: string;
  lede: string;
  story: { opportunity: string; approach: string; outcome: string; why: string } | null;
  /** Photographs in reading order, each with the accessible name of its button ("Open photo 2 of 8"). */
  gallery: { image: ImageAsset; open: string }[];
  galleryCount: string;
  /** Before/after pairs: the room's name and the slider's accessible name. */
  compare: { room: string; slider: string; before: ImageAsset; after: ImageAsset }[];
};

export type PageStrings = {
  facts: { project: string; city: string; category: string; country: string };
  chapters: { opportunity: string; approach: string; outcome: string; why: string };
  compare: { title: string; before: string; after: string; hint: string };
  gallery: { title: string; close: string; prev: string; next: string };
  next: string;
};

export type WindowStrings = { eyebrow: string; explore: string; back: string; more: string; index: string; page: PageStrings };
