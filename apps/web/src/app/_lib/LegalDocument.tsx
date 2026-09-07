import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import type { Locale, SettingsDto } from "@/lib/types";
import JsonLd from "./JsonLd";
import { absoluteUrl, organizationNode, SITE_LEGAL_NAME } from "./site";

/**
 * Șablonul paginilor legale (confidențialitate, termeni — contract C6):
 * antet cu data ultimei actualizări, introducere, secțiuni numerotate
 * roman din cheile `legal.<kind>.sections.*`, plus legătura spre pagina
 * legală pereche și spre contact.
 */

export type LegalKind = "privacy" | "terms";

/** Data ultimei revizuiri a textelor legale (ISO). */
export const LEGAL_UPDATED = "2026-09-01";

const SECTIONS: Record<LegalKind, readonly string[]> = {
  privacy: ["operator", "data", "tips", "purpose", "retention", "rights", "cookies"],
  terms: ["content", "ip", "subscription", "tools", "liability", "law"],
};

const PATHS: Record<LegalKind, string> = {
  privacy: "/confidentialitate",
  terms: "/termeni",
};

export interface LegalDocumentProps {
  kind: LegalKind;
  locale: Locale;
  settings: SettingsDto | null;
}

export default async function LegalDocument({
  kind,
  locale,
  settings,
}: LegalDocumentProps) {
  const t = await getTranslations();
  const contact = settings?.contact ?? null;

  // valorile interpolate în corpul secțiunilor; cheile fără placeholder le ignoră
  const values = {
    email: contact?.email ?? "redactia@corbul.md",
    address:
      (locale === "ru" ? contact?.address_ru : contact?.address_ro) ??
      (locale === "ru" ? "Кишинёв" : "Chișinău"),
    legalName: SITE_LEGAL_NAME,
  };

  const title = t(`legal.${kind}.title`);
  const description = t(`legal.${kind}.description`);
  const other: LegalKind = kind === "privacy" ? "terms" : "privacy";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl(locale, PATHS[kind]),
    inLanguage: locale === "ru" ? "ru-RU" : "ro-RO",
    dateModified: LEGAL_UPDATED,
    isPartOf: { "@type": "WebSite", url: absoluteUrl(locale, "") },
    publisher: organizationNode(locale, settings),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("article.breadcrumbHome"),
          item: absoluteUrl(locale, ""),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: absoluteUrl(locale, PATHS[kind]),
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <Container size="narrow" className="py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="meta uppercase tracking-[0.18em]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-gold">
                {t("article.breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true" className="text-line-2">
              /
            </li>
            <li className="text-fog">{title}</li>
          </ol>
        </nav>

        <article>
          <header className="mt-8 border-b border-line pb-10">
            <p className="kicker">{t("common.siteName")}</p>
            <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl">
              {title}
            </h1>
            <div className="rule-gold mt-7 w-32" />
            <p className="mt-7 font-serif text-lg leading-relaxed text-fog">
              {t(`legal.${kind}.intro`)}
            </p>
            <p className="meta mt-6 uppercase tracking-[0.16em]">
              <time dateTime={LEGAL_UPDATED}>
                {t("legal.updated", { date: formatDate(LEGAL_UPDATED, locale) })}
              </time>
            </p>
          </header>

          <ol className="roman-list roman-list-hang mt-10 divide-y divide-line">
            {SECTIONS[kind].map((key) => (
              // id-ul face fiecare secțiune adresabilă direct; subsolul
              // trimite, de pildă, la /confidentialitate#cookies
              <li key={key} id={key} className="scroll-mt-24 py-8 first:pt-0">
                <h2 className="headline text-2xl text-ivory">
                  {t(`legal.${kind}.sections.${key}.title`)}
                </h2>
                <p className="mt-4 font-serif leading-relaxed text-fog">
                  {t(`legal.${kind}.sections.${key}.body`, values)}
                </p>
              </li>
            ))}
          </ol>

          <footer className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-8 text-xs uppercase tracking-[0.16em]">
            <Link href={PATHS[other]} className="link-gold">
              {t(`legal.${other}.title`)} →
            </Link>
            <Link href="/contact" className="text-mist transition-colors hover:text-gold">
              {t("contact.kicker")}
            </Link>
          </footer>
        </article>
      </Container>
    </>
  );
}
