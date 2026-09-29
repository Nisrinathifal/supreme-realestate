/**
 * Marks copy that is not verbatim from the docs. Returns the string unchanged.
 * scripts/check-placeholders.ts counts draft() calls and fails a launch build while any remain.
 */
export const draft = (s: string): string => s;
