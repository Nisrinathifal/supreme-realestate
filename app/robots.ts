import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const noindex = process.env.NEXT_PUBLIC_NOINDEX === "1";
  return {
    rules: noindex ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/", disallow: ["/api/", "/nl/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
