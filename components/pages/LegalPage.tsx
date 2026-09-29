import { PageIntro } from "@/components/sections/PageIntro";
import { Placeholder } from "@/components/ui/Placeholder";
import { getCopy } from "@/content/copy";
import type { Lang } from "@/content/routes";

type LegalKey = "privacy" | "cookies" | "disclaimer" | "colophon";

/** M1 shell. Document layout with dated legal text lands in M3. */
export function LegalPage({ lang, page }: { lang: Lang; page: LegalKey }) {
  const c = getCopy(lang);
  return (
    <PageIntro title={c.meta.pages[page].title}>
      <Placeholder note={c.legal.placeholderNote} />
    </PageIntro>
  );
}
