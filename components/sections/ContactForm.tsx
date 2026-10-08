"use client";

import { CaretDown, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { type ChangeEvent, type FocusEvent, type FormEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import { RoofMark } from "@/components/brand/RoofMark";
import { Button } from "@/components/ui/Button";
import { company } from "@/content/company";
import { getCopy } from "@/content/copy";
import { type Lang, pathFor } from "@/content/routes";
import { type ContactInput, type ErrorKey, type Field, type FieldErrors, isSubject, readInput, validate } from "@/lib/contact";
import { ease, gsap, prefersReducedMotion, setupGsap } from "@/lib/motion";
import styles from "./ContactForm.module.css";

type Outcome = { kind: "success" } | { kind: "error"; key: "rateLimited" | "failed" } | null;
type Phase = "writing" | "sending" | "sent";
type Copy = ReturnType<typeof getCopy>["form"];
type Preview = Pick<ContactInput, "name" | "organisation" | "email" | "subject" | "message">;

const noop = () => () => {};
/** The address's query, on the client only ("" in the server render, so nothing mismatches on hydration). */
const useQuery = () => useSyncExternalStore(noop, () => window.location.search, () => "");
const blank: Preview = { name: "", organisation: "", email: "", subject: "", message: "" };

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
 * error. `?onderwerp=` pre-selects the subject. Posts JSON; without JavaScript the form posts itself and the page
 * comes back with ?sent=1 or ?error=…, read here. Nothing is stored in the browser.
 *
 * Beside it, the letter (owner, 2026-10-08): a sheet standing in a kraft envelope that carries what is typed, as a
 * letter to the company. Sent, the sheet slides into the envelope, the flap closes under the roof-S seal, and the
 * envelope leaves; then the sentence, and a way to write another. Reduced motion: the closed, sealed envelope at once.
 */
export function ContactForm({ lang }: { lang: Lang }) {
  const c = getCopy(lang).form;
  const id = useId();
  const scene = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [phase, setPhase] = useState<Phase>("writing");
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined); // undefined: nothing happened here yet
  const [subject, setSubject] = useState<string | null>(null); // null: not chosen here yet
  const [preview, setPreview] = useState<Preview>(blank);

  // the subject from the address (?onderwerp=pers), and the outcome of a post made without JavaScript (?sent, ?error)
  const q = new URLSearchParams(useQuery());
  const querySubject = q.get("onderwerp") ?? q.get("subject") ?? "";
  const queryError = q.get("error");
  const queryOutcome: Outcome = q.get("sent") === "1" ? { kind: "success" } : queryError === "rateLimited" || queryError === "failed" ? { kind: "error", key: queryError } : null;
  const chosen = subject ?? (isSubject(querySubject) ? querySubject : "");
  const shownOutcome = outcome === undefined ? queryOutcome : outcome;
  const sent = phase === "sent" || (outcome === undefined && queryOutcome?.kind === "success");

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
  // the letter follows the typing
  const mirror = (e: FormEvent<HTMLFormElement>) => {
    const i = read(e.currentTarget);
    setPreview({ name: i.name, organisation: i.organisation, email: i.email, subject: i.subject, message: i.message });
  };

  /** The sending, as a letter: into the envelope, sealed, away. Resolves when the envelope has gone. */
  const post = () =>
    new Promise<void>((resolve) => {
      const root = scene.current;
      if (!root || prefersReducedMotion()) return resolve();
      setupGsap();
      const s = gsap.utils.selector(root);
      const [sheet, flap, seal, envelope] = [s("[data-sheet]")[0], s("[data-flap]")[0], s("[data-seal]")[0], s("[data-envelope]")[0]];
      // on a narrow screen the envelope sits under the form: bring it into view first
      const r = envelope.getBoundingClientRect();
      const offScreen = r.top < 0 || r.bottom > window.innerHeight;
      if (offScreen) envelope.scrollIntoView({ block: "center", behavior: "smooth" });
      gsap
        .timeline({ defaults: { ease: ease.precise }, delay: offScreen ? 0.5 : 0, onComplete: resolve })
        .to(sheet, { y: () => sheet.offsetHeight * 0.72, duration: 0.7 }, 0) // the sheet slides down into the pocket
        .to(flap, { rotateX: 0, duration: 0.55 }, 0.55) // the flap folds over
        .fromTo(seal, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: ease.out }, 1.0) // the seal is pressed on
        .to(envelope, { y: -24, duration: 0.45, ease: "power2.in" }, 1.6) // a small lift…
        .to(envelope, { y: () => -root.offsetHeight * 0.9, autoAlpha: 0, duration: 0.6, ease: "power2.in" }, 1.95); // …and away
    });

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
    setPhase("sending");
    setOutcome(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-lang": lang }, body: JSON.stringify(input) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: FieldErrors; error?: string };
      if (res.ok && body.ok) {
        await post();
        setOutcome({ kind: "success" });
        setPhase("sent");
        form.reset();
        setSubject("");
        setTouched({});
        setErrors({});
      } else {
        setPhase("writing");
        if (body.errors) setErrors(body.errors);
        else setOutcome({ kind: "error", key: body.error === "rateLimited" ? "rateLimited" : "failed" });
      }
    } catch {
      setPhase("writing");
      setOutcome({ kind: "error", key: "failed" });
    }
  };

  /** A fresh sheet in a fresh envelope. */
  const again = () => {
    const root = scene.current;
    if (root) gsap.set([...root.querySelectorAll("[data-sheet], [data-flap], [data-seal], [data-envelope]")], { clearProps: "all" });
    setPreview(blank);
    setOutcome(null);
    setPhase("writing");
    root?.closest("section")?.querySelector<HTMLElement>('input[name="name"]')?.focus();
  };

  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);
  const fieldProps = (f: Field) => {
    const err = shown(f);
    return { "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-${f}-error` : undefined, onBlur: leave(f), onChange: change(f) };
  };
  const subjectLabel = c.subjects.find((s) => s.value === preview.subject)?.label ?? "";
  const sending = phase === "sending";

  return (
    <div className={styles.layout} data-phase={phase}>
      <form className={styles.form} action="/api/contact" method="post" noValidate onSubmit={submit} onInput={mirror}>
        <input type="hidden" name="lang" value={lang} />
        <div className={styles.row}>
          <div className={styles.field} data-invalid={shown("name") ? "true" : "false"}>
            <FieldLabel id={id} f="name" copy={c} />
            <input id={`${id}-name`} name="name" className={styles.control} autoComplete="name" required {...fieldProps("name")} />
            <FieldError id={id} f="name" err={shown("name")} copy={c} />
          </div>
          <div className={styles.field} data-invalid={shown("organisation") ? "true" : "false"}>
            <FieldLabel id={id} f="organisation" optional copy={c} />
            <input id={`${id}-organisation`} name="organisation" className={styles.control} autoComplete="organization" {...fieldProps("organisation")} />
            <FieldError id={id} f="organisation" err={shown("organisation")} copy={c} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field} data-invalid={shown("email") ? "true" : "false"}>
            <FieldLabel id={id} f="email" copy={c} />
            <input id={`${id}-email`} name="email" type="email" className={styles.control} autoComplete="email" inputMode="email" required {...fieldProps("email")} />
            <FieldError id={id} f="email" err={shown("email")} copy={c} />
          </div>
          <div className={styles.field} data-invalid={shown("phone") ? "true" : "false"}>
            <FieldLabel id={id} f="phone" optional copy={c} />
            <input id={`${id}-phone`} name="phone" type="tel" className={styles.control} autoComplete="tel" inputMode="tel" {...fieldProps("phone")} />
            <FieldError id={id} f="phone" err={shown("phone")} copy={c} />
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
          <textarea id={`${id}-message`} name="message" className={styles.control} rows={6} required {...fieldProps("message")} />
          <FieldError id={id} f="message" err={shown("message")} copy={c} />
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
          <Button type="submit" variant="primary" arrow disabled={sending || sent} aria-busy={sending}>
            {sending ? c.sending : c.submit}
          </Button>
          {shownOutcome?.kind === "error" ? (
            <p className={styles.notice} data-kind="error" role="alert">
              <WarningCircle size={20} weight="light" aria-hidden="true" />
              <span>
                {c.errors[shownOutcome.key]} <a href={`mailto:${company.email}`}>{company.email}</a>
              </span>
            </p>
          ) : null}
        </div>
      </form>

      {/* the letter in its envelope: what is typed, as a letter to the company; decorative for assistive technology */}
      <div ref={scene} className={styles.scene} aria-hidden={sent ? undefined : "true"}>
        <div className={styles.envelope} data-envelope data-sent={sent ? "true" : "false"}>
          <div className={styles.back} />
          <div className={styles.flap} data-flap />
          <div className={styles.sheet} data-sheet>
            <div className={styles.sheetHead}>
              <RoofMark size={22} decorative />
              <span className={styles.sheetTo}>
                {c.letterTo} {company.legalName}
              </span>
            </div>
            <dl className={styles.sheetLines}>
              <div>
                <dt>{c.name}</dt>
                <dd>{preview.name || " "}</dd>
              </div>
              {preview.organisation ? (
                <div>
                  <dt>{c.organisation}</dt>
                  <dd>{preview.organisation}</dd>
                </div>
              ) : null}
              <div>
                <dt>{c.email}</dt>
                <dd>{preview.email || " "}</dd>
              </div>
              <div>
                <dt>{c.subject}</dt>
                <dd>{subjectLabel || " "}</dd>
              </div>
            </dl>
            <p className={styles.sheetMessage}>{preview.message || " "}</p>
          </div>
          <div className={styles.pocket}>
            <span className={styles.fold} />
          </div>
          <span className={styles.seal} data-seal>
            <RoofMark size={26} decorative />
          </span>
        </div>
        {sent ? (
          <div className={styles.sent} role="status">
            <p className={styles.notice}>
              <CheckCircle size={20} weight="light" aria-hidden="true" />
              <span>{c.success}</span>
            </p>
            <Button type="button" variant="secondary" onClick={again}>
              {c.again}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
