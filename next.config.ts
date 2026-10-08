import type { NextConfig } from "next";

/**
 * Security headers per PRD §9.6.
 * CSP: pages are statically generated, so scripts need 'unsafe-inline' (no per-request nonce).
 * Everything else is strict. GSAP writes inline style attributes, hence style-src 'unsafe-inline'.
 */
// Only a site served over HTTPS upgrades its requests and pins HSTS: Safari (unlike Chrome) upgrades localhost too,
// which left the dev and release servers unstyled in the iOS simulator (2026-10-08)
const https = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(https ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  ...(https ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** Paths that must never be rewritten into the /nl tree. */
const passthrough = "en(?:/|$)|nl(?:/|$)|api/|_next/|media/|brand/|fonts/|favicon\\.ico$|icon|apple-icon|robots\\.txt$|sitemap\\.xml$|opengraph-image|manifest";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: __dirname },
  agentRules: false,
  // Static, fully server-rendered 404 for unmatched routes (notFound() from a page is client-rendered only).
  experimental: { globalNotFound: true },
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    // Dutch is served at the root; /nl/* is internal only.
    return [
      { source: "/nl", destination: "/", permanent: true },
      { source: "/nl/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/nl" },
        { source: `/:path((?!${passthrough}).*)`, destination: "/nl/:path" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
