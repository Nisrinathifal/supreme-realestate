import type { Lang } from "./routes";
import type { Copy } from "./copy.types";
import { nl } from "./copy.nl";
import { en } from "./copy.en";

export type { Copy };
export const copy: Record<Lang, Copy> = { nl, en };
export const getCopy = (lang: Lang): Copy => copy[lang];
