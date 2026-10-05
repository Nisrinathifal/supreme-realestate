import type { Lang } from "@/content/routes";

/**
 * A language's flag as a square icon (cropped to a circle by its container): the Dutch tricolour for nl, a
 * simplified Union Jack for en. Decorative; the control that holds it carries the accessible name.
 */
export function Flag({ lang, className }: { lang: Lang; className?: string }) {
  if (lang === "nl") {
    return (
      <svg viewBox="0 0 30 30" className={className} aria-hidden="true" focusable="false">
        <rect width="30" height="10" fill="var(--flag-nl-red)" />
        <rect y="10" width="30" height="10" fill="var(--flag-white)" />
        <rect y="20" width="30" height="10" fill="var(--flag-nl-blue)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true" focusable="false">
      <rect width="30" height="30" fill="var(--flag-uk-blue)" />
      <path d="M0 0 L30 30 M30 0 L0 30" stroke="var(--flag-white)" strokeWidth="6" />
      <path d="M0 0 L30 30 M30 0 L0 30" stroke="var(--flag-uk-red)" strokeWidth="2" />
      <path d="M15 0 V30 M0 15 H30" stroke="var(--flag-white)" strokeWidth="10" />
      <path d="M15 0 V30 M0 15 H30" stroke="var(--flag-uk-red)" strokeWidth="6" />
    </svg>
  );
}
