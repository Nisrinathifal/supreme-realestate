import "server-only";
import { company } from "@/content/company";
import { isSubject, type ContactInput, type Subject } from "@/lib/contact";

/**
 * Delivery of a contact message by e-mail (PRD §9.2): to the address for its subject (MAIL_TO_<SUBJECT>, else
 * MAIL_TO_OVERIG, else the company address), with the consent and its time in the body. Nothing is stored here.
 * MAIL_PROVIDER=mock logs to the server console (development); `http` posts to a transactional provider's JSON API
 * (MAIL_PROVIDER_URL, bearer MAIL_PROVIDER_API_KEY) with the common { from, to, subject, text } shape.
 */
export type Mail = { to: string; from: string; subject: string; text: string };

function recipient(subject: Subject): string {
  const env = process.env;
  const by: Record<Subject, string | undefined> = { samenwerking: env.MAIL_TO_SAMENWERKING, pers: env.MAIL_TO_PERS, juridisch: env.MAIL_TO_JURIDISCH, overig: env.MAIL_TO_OVERIG };
  return by[subject] || env.MAIL_TO_OVERIG || company.email;
}

/** The e-mail for a validated message. The sender's address goes in the body and as reply-to, never as `from`. */
export function compose(input: ContactInput, lang: string, receivedAt: Date): Mail & { replyTo: string } {
  const subject = isSubject(input.subject) ? input.subject : "overig";
  const lines = [
    `Onderwerp / subject: ${subject}`,
    `Naam / name: ${input.name}`,
    input.organisation ? `Organisatie / organisation: ${input.organisation}` : null,
    `E-mail: ${input.email}`,
    input.phone ? `Telefoon / phone: ${input.phone}` : null,
    `Taal / language: ${lang}`,
    "",
    input.message,
    "",
    `Consent: privacybeleid geaccepteerd / privacy policy accepted, ${receivedAt.toISOString()}`,
  ].filter((l): l is string => l !== null);
  return { to: recipient(subject), from: process.env.MAIL_FROM || company.email, replyTo: input.email, subject: `[${subject}] ${company.legalName}: contactformulier`, text: lines.join("\n") };
}

export async function send(mail: Mail & { replyTo: string }): Promise<void> {
  const provider = process.env.MAIL_PROVIDER || "mock";
  if (provider === "mock") {
    if (process.env.NODE_ENV === "production" && process.env.MAIL_ALLOW_MOCK !== "1") throw new Error("MAIL_PROVIDER=mock is not allowed in production");
    console.log(`[mail:mock] to ${mail.to} (reply-to ${mail.replyTo})\n${mail.subject}\n${mail.text}`);
    return;
  }
  if (provider === "http") {
    const url = process.env.MAIL_PROVIDER_URL;
    const key = process.env.MAIL_PROVIDER_API_KEY;
    if (!url || !key) throw new Error("MAIL_PROVIDER_URL and MAIL_PROVIDER_API_KEY are required");
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) throw new Error(`mail provider responded ${res.status}`);
    return;
  }
  throw new Error(`unknown MAIL_PROVIDER "${provider}"`);
}
