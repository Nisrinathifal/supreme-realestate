import { getCopy } from "@/content/copy";
import { projects } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { ProjectStrip } from "./ProjectStrip";

/** The phone's way into the projects (see ProjectStrip), with the copy resolved on the server. */
export function ProjectStripSection({ lang }: { lang: Lang }) {
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
  return <ProjectStrip lang={lang} projects={items} strings={{ index: c.projects.index, more: c.projects.more }} />;
}
