"use client";

import { ENTER_PROJECT } from "@/components/windows/Windows";

/**
 * The link covering a project card in the deck: enters that project the way a window does (the overlay pushes in
 * from the card), so the deck is the way in for anyone who never hovers the facades, and on phones.
 */
export function WorkEnter({ id, label, className }: { id: string; label: string; className: string }) {
  return <button type="button" className={className} aria-label={label} onClick={(e) => document.dispatchEvent(new CustomEvent(ENTER_PROJECT, { detail: { id, from: e.currentTarget } }))} />;
}
