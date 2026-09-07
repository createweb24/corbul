import type { Locale, SettingsDto } from "@/lib/types";

/**
 * Constante de identitate + construcția URL-urilor absolute.
 * Folosite de `generateMetadata`, de JSON-LD și de sitemap.
 */

export const SITE_NAME = "Corbul.md";
export const SITE_LEGAL_NAME = "Corbul.md — jurnalism de investigație";
export const LOCALES: readonly Locale[] = ["ro", "ru"] as const;
export const DEFAULT_LOCALE: Locale = "ro";

/** Adresa publică, fără slash final. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
  return raw.replace(/\/+$/, "");
}

/** `/ro/despre` — calea internă, cu prefixul de limbă. */
export function localePath(locale: Locale, path = ""): string {
  if (!path || path === "/") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** `https://corbul.md/ro/despre` */
export function absoluteUrl(locale: Locale, path = ""): string {
  return `${siteUrl()}${localePath(locale, path)}`;
}

/** Harta hreflang pentru `alternates.languages`. */
export function languageAlternates(path = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of LOCALES) map[locale] = absoluteUrl(locale, path);
  map["x-default"] = absoluteUrl(DEFAULT_LOCALE, path);
  return map;
}

/** Adresa absolută a imaginii OpenGraph pentru o limbă. */
export function ogImageUrl(locale: Locale): string {
  return `${siteUrl()}/${locale}/opengraph-image`;
}

/** Adresa absolută a imaginii OpenGraph generate pentru un articol. */
export function articleOgImageUrl(locale: Locale, slug: string): string {
  return `${absoluteUrl(locale, `/articol/${slug}`)}/opengraph-image`;
}

/** Sigla pătrată (512×512) folosită de `Organization.logo` și ca favicon. */
export function logoUrl(): string {
  return `${siteUrl()}/icon.svg`;
}

/**
 * Nodul JSON-LD al editorului — complet, nu doar o referință `@id`.
 * Validatoarele rezolvă `@id` doar în același document, deci nodul apare
 * în `@graph` pe acasă, despre, contact, articol (publisher) și autor
 * (worksFor). `sameAs` iese din setarea `social` (contract C5).
 */
export function organizationNode(
  locale: Locale,
  settings: SettingsDto | null,
): Record<string, unknown> {
  const sameAs = Object.values(settings?.social ?? {}).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return {
    "@type": "NewsMediaOrganization",
    "@id": `${siteUrl()}/#organization`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: siteUrl(),
    logo: {
      "@type": "ImageObject",
      url: logoUrl(),
      width: 512,
      height: 512,
    },
    areaServed: "MD",
    ethicsPolicy: absoluteUrl(locale, "/despre"),
    correctionsPolicy: absoluteUrl(locale, "/despre"),
    ownershipFundingInfo: absoluteUrl(locale, "/despre"),
    actionableFeedbackPolicy: absoluteUrl(locale, "/contact"),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
