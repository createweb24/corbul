import { routing } from "@/i18n/routing";
import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderOgImage,
} from "../_lib/ogImage";

/**
 * Imaginea OpenGraph a paginilor publice, servită cu prefix de limbă
 * (`/ro/opengraph-image`, `/ru/opengraph-image`).
 *
 * Există în plus față de cea din rădăcină pentru că middleware-ul i18n
 * redirecționează orice cale fără prefix și fără extensie — inclusiv
 * `/opengraph-image` — spre limba implicită. Next o atașează automat
 * tuturor rutelor din acest segment, deci `generateMetadata` nu trebuie
 * să declare `openGraph.images`.
 */

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return renderOgImage(locale);
}
