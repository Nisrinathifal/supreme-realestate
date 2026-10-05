import { getCopy } from "@/content/copy";
import { projects } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { Windows } from "./Windows";

/** Resolves the copy for the project windows on the server and hands plain strings to the client layer. */
export function ProjectWindows({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const items = projects.map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    category: c.projects.categories[p.category],
    country: c.projects.country,
    description: c.projects.items[p.id]?.description ?? "",
    label: c.projects.hotspot(p.name),
    preview: p.preview,
    interior: p.interior,
    window: p.window,
  }));
  const { eyebrow, explore, back, more, index } = c.projects;
  return <Windows lang={lang} projects={items} strings={{ eyebrow, explore, back, more, index }} />;
}
