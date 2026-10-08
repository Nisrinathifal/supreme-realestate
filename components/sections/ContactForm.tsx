"use client";

import { CaretDown, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { type ChangeEvent, type FocusEvent, type FormEvent, useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { company } from "@/content/company";
import { getCopy } from "@/content/copy";
import { type Lang, pathFor } from "@/content/routes";
import { type ContactInput, type ErrorKey, type Field, type FieldErrors, isSubject, readInput, validate } from "@/lib/contact";
import styles from "./ContactForm.module.css";

type Outcome = { kind: "success" } | { kind: "error"; key: "rateLimited" | "failed" } | null;
type Copy = ReturnType<typeof getCopy>["form"];

const noop = () => () => {};
/** The address's query, on the client only ("" in the server render, so nothing mismatches on hydration). */
const useQuery = () => useSyncExternalStore(noop, () => window.location.search, () => "");

/** A field's error, under it: the message with its icon, announced, linked from the field by aria-describedby. */
function FieldError({ id, f, err, copy }: { id: string; f: Field; err: ErrorKey | undefined; copy: Copy }) {
  if (!err) return null;
  return (
    <p id={`${id}-${f}-error`} className={styles.error} role="alert">
      <WarningCircle size={18} weight="light" aria-hidden="true" />
      <span>{copy.errors[err]}</span>
    </p>
  );
}

function FieldLabel({ id, f, optional, copy }: { id: string; f: Exclude<Field, "consent">; optional?: boolean; copy: Copy }) {
  return (
    <label htmlFor={`${id}-${f}`} className={styles.label}>
      {copy[f]}
      {optional ? <span className={styles.optional}> ({copy.optional})</span> : null}
    </label>
  );
}

/**
 * The contact form (DESIGN §9.11, PRD §9.2): name, organisation (optional), e-mail, phone (optional), subject, message,
 * consent. Validated on the client as the server does (lib/contact): each field's error under it, specific, with an
 * icon, linked by aria-describedby; checked when a field is left and again on submit, which moves focus to the first
 * error. The order follows the reference forms studied (Linear, Vercel, 2026-10-08): who you are, then the subject and
 * the message, the optionals after, consent last; every field shows an example of what goes in it; the e-mail address
 * stands beside the button as the other way in. `?onderwerp=` pre-selects the subject. Posts JSON; without JavaScript the form posts itself and the page
 * comes back with ?sent=1 or ?error=…, read here. Nothing is stored in the browser.
 */
export function ContactForm({ lang }: { lang: Lang }) {
  const c = getCopy(lang).form;
  const id = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined); // undefined: nothing happened here yet
  const [subject, setSubject] = useState<string | null>(null); // null: not chosen here yet

  // the subject from the address (?onderwerp=pers), and the outcome of a post made without JavaScript (?sent, ?error)
  const q = new URLSearchParams(useQuery());
  const querySubject = q.get("onderwerp") ?? q.get("subject") ?? "";
  const queryError = q.get("error");
  const queryOutcome: Outcome = q.get("sent") === "1" ? { kind: "success" } : queryError === "rateLimited" || queryError === "failed" ? { kind: "error", key: queryError } : null;
  const chosen = subject ?? (isSubject(querySubject) ? querySubject : "");
  const shownOutcome = outcome === undefined ? queryOutcome : outcome;

  const read = (form: HTMLFormElement): ContactInput => readInput(Object.fromEntries(new FormData(form).entries()));

  type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  // a field is judged once it has been left, so nobody is told off while still typing; once judged, it is judged
  // again as it changes, so an error clears the moment it is put right (and nothing moves under the pointer later)
  const leave = (f: Field) => (e: FocusEvent<Control>) => {
    const form = e.currentTarget.form;
    setTouched((t) => ({ ...t, [f]: true }));
    if (form) setErrors(validate(read(form)));
  };
  const change = (f: Field) => (e: ChangeEvent<Control>) => {
    const form = e.currentTarget.form;
    if (touched[f] && form) setErrors(validate(read(form)));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = read(form);
    const all = validate(input);
    setErrors(all);
    setTouched({ name: true, organisation: true, email: true, phone: true, subject: true, message: true, consent: true });
    const first = (Object.keys(all) as Field[])[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-lang": lang }, body: JSON.stringify(input) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: FieldErrors; error?: string };
      if (res.ok && body.ok) {
        setOutcome({ kind: "success" });
        form.reset();
        setSubject("");
        setTouched({});
        setErrors({});
      } else if (body.errors) {
        setErrors(body.errors);
      } else {
        setOutcome({ kind: "error", key: body.error === "rateLimited" ? "rateLimited" : "failed" });
      }
    } catch {
      setOutcome({ kind: "error", key: "failed" });
    } finally {
      setSending(false);
    }
  };

  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);
  const fieldProps = (f: Field) => {
    const err = shown(f);
    return { "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-${f}-error` : undefined, onBlur: leave(f), onChange: change(f) };
  };

  return (
    <form className={styles.form} action="/api/contact" method="post" noValidate onSubmit={submit}>
      <input type="hidden" name="lang" value={lang} />
      <div className={styles.row}>
        <div className={styles.field} data-invalid={shown("name") ? "true" : "false"}>
          <FieldLabel id={id} f="name" copy={c} />
          <input id={`${id}-name`} name="name" className={styles.control} autoComplete="name" placeholder={c.placeholders.name} required {...fieldProps("name")} />
          <FieldError id={id} f="name" err={shown("name")} copy={c} />
        </div>
        <div className={styles.field} data-invalid={shown("email") ? "true" : "false"}>
          <FieldLabel id={id} f="email" copy={c} />
          <input id={`${id}-email`} name="email" type="email" className={styles.control} autoComplete="email" inputMode="email" placeholder={c.placeholders.email} required {...fieldProps("email")} />
          <FieldError id={id} f="email" err={shown("email")} copy={c} />
        </div>
      </div>
      <div className={styles.field} data-invalid={shown("subject") ? "true" : "false"}>
        <FieldLabel id={id} f="subject" copy={c} />
        <div className={styles.selectWrap}>
          <select
            id={`${id}-subject`}
            name="subject"
            className={styles.control}
            value={chosen}
            required
            {...fieldProps("subject")}
            onChange={(e) => {
              setSubject(e.target.value);
              change("subject")(e);
            }}
          >
            <option value="" disabled>
              {c.subjectPlaceholder}
            </option>
            {c.subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <CaretDown size={18} weight="light" aria-hidden="true" />
        </div>
        <FieldError id={id} f="subject" err={shown("subject")} copy={c} />
      </div>
      <div className={styles.field} data-invalid={shown("message") ? "true" : "false"}>
        <FieldLabel id={id} f="message" copy={c} />
        <textarea id={`${id}-message`} name="message" className={styles.control} rows={6} placeholder={c.placeholders.message} required {...fieldProps("message")} />
        <FieldError id={id} f="message" err={shown("message")} copy={c} />
      </div>
      {/* the optional pair after the message, so the required path reads straight down (the reference forms ask for 4–5 things) */}
      <div className={styles.row}>
        <div className={styles.field} data-invalid={shown("organisation") ? "true" : "false"}>
          <FieldLabel id={id} f="organisation" optional copy={c} />
          <input id={`${id}-organisation`} name="organisation" className={styles.control} autoComplete="organization" placeholder={c.placeholders.organisation} {...fieldProps("organisation")} />
          <FieldError id={id} f="organisation" err={shown("organisation")} copy={c} />
        </div>
        <div className={styles.field} data-invalid={shown("phone") ? "true" : "false"}>
          <FieldLabel id={id} f="phone" optional copy={c} />
          <input id={`${id}-phone`} name="phone" type="tel" className={styles.control} autoComplete="tel" inputMode="tel" placeholder={c.placeholders.phone} {...fieldProps("phone")} />
          <FieldError id={id} f="phone" err={shown("phone")} copy={c} />
        </div>
      </div>
      <div className={styles.field} data-invalid={shown("consent") ? "true" : "false"}>
        <label className={styles.consent}>
          <input type="checkbox" name="consent" required {...fieldProps("consent")} />
          <span>
            {c.consent} <a href={pathFor("privacy", lang)}>{c.consentLink}</a>.
          </span>
        </label>
        <FieldError id={id} f="consent" err={shown("consent")} copy={c} />
      </div>
      {/* the honeypot */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className={styles.actions}>
        <Button type="submit" variant="primary" arrow disabled={sending} aria-busy={sending}>
          {sending ? c.sending : c.submit}
        </Button>
        <p className={styles.orMail}>
          {c.orMail} <a href={`mailto:${company.email}`}>{company.email}</a>
        </p>
        {shownOutcome?.kind === "success" ? (
          <p className={styles.notice} role="status">
            <CheckCircle size={20} weight="light" aria-hidden="true" />
            <span>{c.success}</span>
          </p>
        ) : null}
        {shownOutcome?.kind === "error" ? (
          <p className={styles.notice} data-kind="error" role="alert">
            <WarningCircle size={20} weight="light" aria-hidden="true" />
            <span>
              {c.errors[shownOutcome.key]}
            </span>
          </p>
        ) : null}
      </div>
    </form>
  );
}
