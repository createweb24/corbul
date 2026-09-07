import type { ArticleListDto, Locale, SettingsDto } from "@/lib/types";
import { absoluteUrl, articleOgImageUrl, logoUrl, SITE_NAME, siteUrl } from "./site";

/**
 * Fluxul RSS 2.0 al site-ului, pe limbă — `/ro/rss.xml`, `/ru/rss.xml`.
 * Construit de mână (fără bibliotecă): titlu, lede, autor, rubrică, dată,
 * imaginea OG a articolului ca `enclosure`. Articolele premium apar cu
 * lede-ul, ca orice cititor de feed să vadă ce se publică.
 */

const FEED_SIZE = 30;

const DESCRIPTION: Record<Locale, string> = {
  ro: "Investigații, analize economice și juridice din Republica Moldova.",
  ru: "Расследования, экономическая и юридическая аналитика из Республики Молдова.",
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export function feedPath(locale: Locale): string {
  return absoluteUrl(locale, "/rss.xml");
}

export function buildRssFeed(
  locale: Locale,
  articles: ArticleListDto[],
  settings: SettingsDto | null,
): string {
  const items = articles.slice(0, FEED_SIZE);
  const tagline = settings?.tagline?.[locale];
  const description = tagline ? `${tagline}. ${DESCRIPTION[locale]}` : DESCRIPTION[locale];
  const language = locale === "ru" ? "ru-RU" : "ro-RO";
  const lastBuild = items[0]?.publishedAt ?? new Date().toISOString();

  const entries = items
    .map((article) => {
      const link = absoluteUrl(locale, `/articol/${article.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${rfc822(article.publishedAt)}</pubDate>`,
        `      <dc:creator>${escapeXml(article.author.name)}</dc:creator>`,
        `      <category>${escapeXml(article.categoryName)}</category>`,
        `      <description>${escapeXml(article.summary)}</description>`,
        `      <enclosure url="${articleOgImageUrl(locale, article.slug)}" type="image/png" length="0" />`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${absoluteUrl(locale)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${language}</language>`,
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>`,
    "    <ttl>15</ttl>",
    `    <atom:link href="${feedPath(locale)}" rel="self" type="application/rss+xml" />`,
    "    <image>",
    `      <url>${logoUrl()}</url>`,
    `      <title>${escapeXml(SITE_NAME)}</title>`,
    `      <link>${siteUrl()}</link>`,
    "    </image>",
    entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
