"use client";

import { createContext, useContext } from "react";
import { defaultLang, type Lang } from "@/content/routes";

const LangContext = createContext<Lang>(defaultLang);

/** Provides the route language to client components that cannot receive params (e.g. not-found). */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
