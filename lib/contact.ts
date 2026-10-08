/**
 * The contact form's shape and validation (PRD §9.2, DESIGN §9.11), shared by the form (client) and the route
 * (server), so both judge a message the same way. Error keys map to copy `form.errors`.
 */
export const SUBJECTS = ["samenwerking", "pers", "juridisch", "overig"] as const;
export type Subject = (typeof SUBJECTS)[number];

export type ContactInput = {
  name: string;
  organisation: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  /** The honeypot: a field people never see; anything in it marks a bot. */
  website: string;
};

export type Field = "name" | "organisation" | "email" | "phone" | "subject" | "message" | "consent";
export type ErrorKey = "required" | "email" | "tooLong" | "consent";
export type FieldErrors = Partial<Record<Field, ErrorKey>>;

export const LIMITS: Record<Exclude<Field, "consent">, number> = { name: 120, organisation: 160, email: 254, phone: 40, subject: 20, message: 4000 };

// A pragmatic address check: one @, something either side, a dot in the domain, no spaces
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isSubject = (v: string): v is Subject => (SUBJECTS as readonly string[]).includes(v);

/** Reads the fields from any record (JSON or form data), trimmed, so both sides start from the same shape. */
export function readInput(data: Record<string, unknown>): ContactInput {
  const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string).trim() : "");
  const consent = data.consent === true || data.consent === "on" || data.consent === "true";
  return { name: str("name"), organisation: str("organisation"), email: str("email"), phone: str("phone"), subject: str("subject"), message: str("message"), consent, website: str("website") };
}

/** The errors of a message, one per field at most, in the form's order. Empty = valid. */
export function validate(input: ContactInput): FieldErrors {
  const e: FieldErrors = {};
  for (const f of ["name", "organisation", "email", "phone", "subject", "message"] as const) {
    if (input[f].length > LIMITS[f]) e[f] = "tooLong";
  }
  if (!input.name) e.name = "required";
  if (!input.email) e.email = "required";
  else if (!e.email && !EMAIL.test(input.email)) e.email = "email";
  if (!input.subject || !isSubject(input.subject)) e.subject = "required";
  if (!input.message) e.message = "required";
  if (!input.consent) e.consent = "consent";
  return e;
}
