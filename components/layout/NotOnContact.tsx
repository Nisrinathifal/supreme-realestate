"use client";

import type { ReactNode } from "react";
import { pageForPath } from "@/content/routes";
import { usePublicPathname } from "@/lib/usePublicPathname";

/** Renders its children on every page but the contact page (owner, 2026-10-08: no "get in touch" band under the form). */
export function NotOnContact({ children }: { children: ReactNode }) {
  const page = pageForPath(usePublicPathname())?.page;
  return page === "contact" ? null : <>{children}</>;
}
