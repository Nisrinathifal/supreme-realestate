import { getCopy } from "@/content/copy";
import { projects } from "@/content/projects";
import type { Lang } from "@/content/routes";
import { Windows, type WindowProject } from "./Windows";

/** Resolves the copy for the project windows and the project pages on the server and hands plain strings to the client layer. */
export function ProjectWindows({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const pg = c.projects.page;
  const cr = pg.credits;
  const items: WindowProject[] = projects.map((p) => {
    const story = c.projects.items[p.id];
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      category: c.projects.categories[p.category],
      country: c.projects.country,
      label: c.projects.hotspot(p.name),
      preview: p.preview,
      interior: p.interior,
      window: p.window,
      title: story?.title ?? p.name,
      lede: story?.lede ?? "",
      story: story ?? null,
      gallery: p.gallery.map((image, i) => ({ image, open: pg.gallery.open(i + 1, p.gallery.length) })),
      galleryCount: pg.gallery.count(p.gallery.length),
      credits: [
        { label: cr.developer, value: c.siteName, pending: false, hero: true },
        { label: cr.architect, value: p.credits.architect ?? cr.pending, pending: !p.credits.architect, hero: true },
        { label: cr.builder, value: p.credits.builder ?? cr.pending, pending: !p.credits.builder, hero: true },
        { label: cr.interior, value: p.credits.interior ?? cr.pending, pending: !p.credits.interior, hero: false },
        { label: cr.photography, value: p.credits.photography ?? cr.pending, pending: !p.credits.photography, hero: true },
        { label: cr.location, value: `${p.location}, ${c.projects.country}`, pending: false, hero: false },
        { label: cr.category, value: c.projects.categories[p.category], pending: false, hero: false },
      ],
      compare: p.compare.map((pair) => {
        const room = pg.rooms[pair.room] ?? pair.room;
        return { room, slider: pg.compare.slider(room), before: pair.before, after: pair.after };
      }),
    };
  });
  const { eyebrow, explore, back, more, index } = c.projects;
  const page = {
    overview: pg.overview,
    details: pg.details,
    chapters: pg.chapters,
    compare: { title: pg.compare.title, before: pg.compare.before, after: pg.compare.after, hint: pg.compare.hint },
    gallery: { title: pg.gallery.title, close: pg.gallery.close, prev: pg.gallery.prev, next: pg.gallery.next },
    others: pg.others,
    view: pg.view,
  };
  return <Windows lang={lang} projects={items} strings={{ eyebrow, explore, back, more, index, page }} />;
}
