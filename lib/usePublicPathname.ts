"use client";

import { usePathname } from "next/navigation";

/**
 * Public pathname as the visitor sees it. Dutch pages are served through a rewrite to /nl/*, so during
 * prerender usePathname() reports the internal path; strip that prefix so server and client agree
 * (otherwise aria-current and the language toggle mismatch on hydration).
 */
export function usePublicPathname(): string {
  const raw = usePathname() ?? "/";
  const stripped = raw.replace(/^\/nl(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}
