import type { Metadata } from "next";
import type { Locale } from "@/lib/types";
import { OG_ALT, OG_SIZE } from "./ogImage";
import { absoluteUrl, languageAlternates, ogImageUrl, SITE_NAME, siteUrl } from "./site";

/**
 * Constructor unic de `Metadata`: title, description, canonical, hreflang
 * ro/ru + x-default, OpenGraph și Twitter card. Toate paginile publice
 * trec prin el, ca semnalele SEO să fie identice ca formă (SPEC §10).
 */

/** Peste această lungime sufixul „| Corbul.md" nu mai încape în SERP. */
const TEMPLATE_TITLE_MAX = 55;

export interface PageSeo {
  locale: Locale;
  /** calea fără prefixul de limbă: "", "/despre", "/articol/slug" */
  path?: string;
  title: string;
  description: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string | null;
  authors?: string[];
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  /** suprascrie titlul din tab-ul browserului (fără șablonul „| Corbul.md") */
  absoluteTitle?: boolean;
  /** imagine OG proprie paginii (absolută); implicit imaginea site-ului */
  image?: string;
  /** textul alternativ al imaginii OG proprii */
  imageAlt?: string;
  /** canonical alternativ (ex. paginile 2+ ale unei rubrici) */
  canonicalPath?: string;
}

export function buildMetadata(seo: PageSeo): Metadata {
  const path = seo.path ?? "";
  const canonical = absoluteUrl(seo.locale, seo.canonicalPath ?? path);
  const ogLocale = seo.locale === "ru" ? "ru_RU" : "ro_RO";

  // titlurile lungi de articol rămân întregi: brandul e deja în og:site_name
  // și în JSON-LD, iar un sufix tăiat la mijloc arată neîngrijit în rezultate
  const absolute =
    seo.absoluteTitle ||
    (seo.type === "article" && seo.title.length > TEMPLATE_TITLE_MAX);

  const image = {
    url: seo.image ?? ogImageUrl(seo.locale),
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    alt: seo.imageAlt ?? OG_ALT,
    type: "image/png",
  };

  const metadata: Metadata = {
    metadataBase: new URL(siteUrl()),
    title: absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: {
      canonical,
      languages: languageAlternates(seo.canonicalPath ?? path),
      // autodiscovery-ul fluxului RSS al limbii curente (`/ro/rss.xml`)
      types: { "application/rss+xml": absoluteUrl(seo.locale, "/rss.xml") },
    },
    openGraph: {
      type: seo.type ?? "website",
      title: seo.title,
      description: seo.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocale,
      alternateLocale: seo.locale === "ru" ? "ro_RO" : "ru_RU",
      images: [image],
      ...(seo.type === "article"
        ? {
            publishedTime: seo.publishedTime,
            modifiedTime: seo.modifiedTime ?? seo.publishedTime,
            authors: seo.authors,
            section: seo.section,
            tags: seo.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [image.url],
    },
  };

  if (seo.noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}
