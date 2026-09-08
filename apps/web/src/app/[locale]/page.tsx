import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdSlot } from "@/components/ads";
import { Card, Container, EmptyState } from "@/components/ui";
import type { Locale } from "@/lib/types";
import JsonLd from "../_lib/JsonLd";
import { getArticlePool, getSettings } from "../_lib/data";
import { buildMetadata } from "../_lib/seo";
import { absoluteUrl, organizationNode, SITE_NAME, siteUrl } from "../_lib/site";

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return buildMetadata({
    locale,
    path: "",
    title: t("home.title"),
    description: t("home.description"),
    absoluteTitle: true,
  });
}

/* ------------------------------------------------------------------ */
/* Pagina                                                              */
/* ------------------------------------------------------------------ */

/**
 * Prima pagină, în formă scurtă: deschiderea ediției și trei materiale
 * dedesubt. Ordinea de alegere a deschiderii — „ultima oră", apoi
 * „recomandat", altfel cel mai recent — iar cele trei de sub ea sunt
 * următoarele din flux, fără repetare.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [articles, settings] = await Promise.all([
    getArticlePool(locale),
    getSettings(),
  ]);

  const hero =
    articles.find((a) => a.breaking) ??
    articles.find((a) => a.featured) ??
    articles[0] ??
    null;
  const rest = articles.filter((a) => a.id !== hero?.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        url: absoluteUrl(locale, ""),
        name: SITE_NAME,
        inLanguage: "ro-RO",
        description: t("home.description"),
        publisher: { "@id": `${siteUrl()}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl(locale, "/cautare")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      organizationNode(locale, settings),
    ],
  };

  if (!hero) {
    return (
      <>
        <JsonLd data={jsonLd} />
        <Container className="py-24">
          <EmptyState title={t("home.empty")} description={t("errors.apiDown")} />
        </Container>
      </>
    );
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* spațierea stă pe AdSlot, nu pe Container: fără reclamă componenta
          nu randează nimic, iar containerul rămâne de înălțime zero */}
      <Container>
        <AdSlot zoneKey="header_leaderboard" className="pt-6" />
      </Container>

      <Container as="section" className="py-8 lg:py-12">
        {/* singurul <h1> al primei pagini: titlul publicației, nu al unui
            material — cardurile poartă h2/h3 (SPEC §10) */}
        <h1 className="sr-only">{t("home.title")}</h1>

        <Card article={hero} locale={locale} variant="lead" />

        {/* În flux: între deschiderea ediției și cele trei materiale de sub ea
            — poziția pe care Google o numește „in-feed" și singurul loc din
            prima pagină unde o reclamă nu întrerupe o lectură începută. */}
        <AdSlot zoneKey="home_infeed" className="py-10" />

        {rest.length > 0 ? (
          <div className="grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 lg:pt-14">
            {rest.map((article) => (
              <Card
                key={article.id}
                article={article}
                locale={locale}
                variant="standard"
              />
            ))}
          </div>
        ) : null}
      </Container>
    </>
  );
}
