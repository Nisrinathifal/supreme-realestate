import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { resolveLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return pageMetadata(resolveLang((await params).lang), "home");
}

export default async function Page({ params }: Params) {
  const lang = resolveLang((await params).lang);
  return <HomePage lang={lang} />;
}
