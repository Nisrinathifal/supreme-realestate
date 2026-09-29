/**
 * Visible development placeholder for content that is not delivered yet.
 * scripts/check-placeholders.ts fails a launch build while any <Placeholder> renders.
 */
export function Placeholder({ note, className }: { note: string; className?: string }) {
  return (
    <p className={["placeholder", className].filter(Boolean).join(" ")} data-placeholder>
      {note}
    </p>
  );
}
