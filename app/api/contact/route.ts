import { NextResponse } from "next/server";
import { pathFor } from "@/content/routes";
import { resolveLang } from "@/lib/i18n";
import { readInput, validate } from "@/lib/contact";
import { compose, send } from "@/lib/mail";

/**
 * The contact form's endpoint (PRD §9.2): validates like the form, drops bots silently (honeypot), limits each address
 * to a few messages per window, sends the e-mail and keeps nothing. Input is never reflected. JSON in → JSON out;
 * a plain form post (no JavaScript) is answered with a redirect back to the contact page carrying ?sent=1 or
 * ?error=<key>, which the form reads.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_BODY = 16 * 1024;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const type = req.headers.get("content-type") ?? "";
  const asForm = !type.includes("application/json");
  // the language: a header (the script), else the form's own field, else the query, else Dutch
  let lang = resolveLang(req.headers.get("x-lang") ?? new URL(req.url).searchParams.get("lang") ?? "nl");
  const back = (q: string) => NextResponse.redirect(new URL(`${pathFor("contact", lang)}?${q}`, req.url), 303);
  const answer = (status: number, body: Record<string, unknown>, q: string) => (asForm ? back(q) : NextResponse.json(body, { status }));

  const raw = await req.text();
  if (raw.length > MAX_BODY) return answer(413, { ok: false, error: "tooLong" }, "error=tooLong");
  let data: Record<string, unknown> = {};
  try {
    data = asForm ? Object.fromEntries(new URLSearchParams(raw)) : (JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return answer(400, { ok: false, error: "failed" }, "error=failed");
  }
  if (!req.headers.get("x-lang") && typeof data.lang === "string") lang = resolveLang(data.lang);
  const input = readInput(data);
  // a bot filled the field people never see: say nothing, send nothing
  if (input.website) return answer(200, { ok: true }, "sent=1");

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return answer(429, { ok: false, error: "rateLimited" }, "error=rateLimited");

  const errors = validate(input);
  if (Object.keys(errors).length) return answer(400, { ok: false, errors }, "error=invalid");

  try {
    await send(compose(input, lang, new Date()));
  } catch (e) {
    console.error("[contact] delivery failed:", e instanceof Error ? e.message : e);
    return answer(502, { ok: false, error: "failed" }, "error=failed");
  }
  return answer(200, { ok: true }, "sent=1");
}
