import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { getArticle } from "../../../_lib/data";
import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderArticleOgImage,
  renderOgImage,
} from "../../../_lib/ogImage";

/**
 * `/ro/articol/{slug}/opengraph-image` — imaginea socială a articolului:
 * coperta lui generată + rubrica, titlul, autorul și data. Dacă articolul
 * nu există (sau API-ul e oprit), se întoarce imaginea generică a site-ului,
 * ca legătura distribuită să aibă mereu o imagine validă.
 */

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ArticleOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = raw === "ru" ? "ru" : "ro";
  const article = await getArticle(slug, locale, null);
  if (!article) return renderOgImage(locale);

  return renderArticleOgImage({
    locale,
    title: article.title,
    category: article.categoryName,
    author: article.author.name,
    date: formatDate(article.publishedAt, locale),
    coverSeed: article.coverSeed,
    hue: article.categoryHue,
    premium: article.premium,
  });
}
