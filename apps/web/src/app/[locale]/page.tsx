import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment } from "react";
import { AdSlot } from "@/components/ads";
import { Card, Container, EmptyState, SectionHead } from "@/components/ui";
import { Sidebar } from "@/components/widgets";
import type { ArticleListDto, Locale } from "@/lib/types";
import JsonLd from "../_lib/JsonLd";
import { getArticlePool, getSettings, getSidebarData } from "../_lib/data";
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
/* Selecția editorială — un articol nu apare de două ori pe pagină     */
/* ------------------------------------------------------------------ */

class Pool {
  private readonly used = new Set<number>();

  constructor(private readonly items: ArticleListDto[]) {}

  take(count: number, filter?: (a: ArticleListDto) => boolean): ArticleListDto[] {
    const out: ArticleListDto[] = [];
    for (const item of this.items) {
      if (out.length >= count) break;
      if (this.used.has(item.id)) continue;
      if (filter && !filter(item)) continue;
      this.used.add(item.id);
      out.push(item);
    }
    return out;
  }

  first(filter?: (a: ArticleListDto) => boolean): ArticleListDto | null {
    return this.take(1, filter)[0] ?? null;
  }
}

const BANDS: { key: string; slugs: string[]; href: string }[] = [
  { key: "politics", slugs: ["politica", "business-public"], href: "/politica" },
  { key: "economy", slugs: ["economie", "finante"], href: "/economie" },
  { key: "energy", slugs: ["energie", "infrastructura"], href: "/energie" },
  { key: "legal", slugs: ["juridic", "coruptie"], href: "/juridic" },
];

const inCategories =
  (slugs: string[]) =>
  (article: ArticleListDto): boolean =>
    slugs.includes(article.categorySlug);

/* ------------------------------------------------------------------ */
/* Pagina                                                              */
/* ------------------------------------------------------------------ */

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [articles, sidebar, settings] = await Promise.all([
    getArticlePool(locale),
    getSidebarData(locale),
    getSettings(),
  ]);

  const pool = new Pool(articles);

  // Ordinea de servire contează: fiecare articol este consumat o singură dată.
  // 1. deschiderea ediției — întâi „ultima oră", apoi „recomandat", altfel
  //    cel mai recent material;
  // 2. investigațiile, ca secțiunea-vitrină să fie mereu plină;
  // 3. restul selecției redacției, benzile tematice, opiniile și fluxul.
  const hero =
    pool.first((a) => a.breaking) ?? pool.first((a) => a.featured) ?? pool.first();
  const investigations = pool.take(3, inCategories(["investigatii"]));
  const heroSide = pool.take(3, (a) => a.featured || a.breaking);
  const bands = BANDS.map((band) => ({
    ...band,
    items: pool.take(3, inCategories(band.slugs)),
  })).filter((band) => band.items.length > 0);
  const opinions = pool.take(3, inCategories(["opinie", "analize"]));

  // Reclama din flux stă după banda „Economie și Finanțe" (ADS-SPEC §3).
  // Dacă acea bandă lipsește (categoria e goală), coboară pe prima bandă —
  // niciodată după ultima, ca să rămână „în flux", nu la coada paginii.
  const economyIndex = bands.findIndex((band) => band.key === "economy");
  const infeedAfter =
    bands.length > 1 ? (economyIndex >= 0 ? economyIndex : 0) : -1;

  // Fluxul editorial este o rubrică cronologică, nu o selecție: arată cele mai
  // recente materiale care NU sunt deja deasupra liniei de îndoire. Se poate
  // suprapune cu benzile tematice de mai jos, niciodată cu deschiderea ediției.
  const aboveFold = new Set<number>([
    ...(hero ? [hero.id] : []),
    ...heroSide.map((article) => article.id),
    ...investigations.map((article) => article.id),
  ]);
  const latest = articles
    .filter((article) => !aboveFold.has(article.id))
    .slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        url: absoluteUrl(locale, ""),
        name: SITE_NAME,
        inLanguage: locale === "ru" ? "ru-RU" : "ro-RO",
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

  if (articles.length === 0) {
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

      {/* ------------------------------------------------------------ */}
      {/* Bandă publicitară — primul element sub banda rulantă          */}
      {/* ------------------------------------------------------------ */}
      {/* spațierea stă pe AdSlot, nu pe Container: fără reclamă componenta
          nu randează nimic, iar containerul rămâne de înălțime zero */}
      <Container>
        <AdSlot zoneKey="header_leaderboard" className="pt-6" />
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Deschiderea ediției + selecția redacției                      */}
      {/* ------------------------------------------------------------ */}
      <Container as="section" aria-label={t("home.hero.kicker")} className="border-b border-line py-10 lg:py-14">
        {/* singurul <h1> al primei pagini: titlul publicației, nu al unui
            material — cardurile poartă h2/h3 (SPEC §10) */}
        <h1 className="sr-only">{t("home.title")}</h1>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:gap-12">
          {hero ? <Card article={hero} locale={locale} variant="lead" /> : null}

          {heroSide.length > 0 ? (
            <div className="lg:border-l lg:border-line lg:pl-10">
              <p className="kicker">{t("home.featured.kicker")}</p>
              <h2 className="headline mt-2 text-xl text-ivory">
                {t("home.featured.title")}
              </h2>
              <div className="mt-6 flex flex-col divide-y divide-line">
                {heroSide.map((article, index) => (
                  <div key={article.id} className="py-5 first:pt-0 last:pb-0">
                    <Card
                      article={article}
                      locale={locale}
                      variant="minimal"
                      index={index + 1}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Investigațiile Corbului — chenar auriu dublu                  */}
      {/* ------------------------------------------------------------ */}
      {investigations.length > 0 ? (
        <section aria-labelledby="investigatii" className="bg-coal/50">
          <Container className="py-14 lg:py-20">
            <div className="double-frame px-6 py-10 md:px-12 md:py-14">
              <div className="mx-auto max-w-3xl text-center">
                <p className="kicker">{t("home.investigations.kicker")}</p>
                <h2
                  id="investigatii"
                  className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl"
                >
                  {t("home.investigations.title")}
                </h2>
                <div className="rule-gold-center mx-auto mt-6 w-24" />
                <p className="mx-auto mt-6 max-w-2xl font-serif text-base leading-relaxed text-fog md:text-lg">
                  {t("home.investigations.subtitle")}
                </p>
              </div>

              <div
                className={`mt-12 grid gap-8 md:gap-10 ${
                  investigations.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
                }`}
              >
                {investigations.map((article) => (
                  <Card
                    key={article.id}
                    article={article}
                    locale={locale}
                    variant="standard"
                  />
                ))}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Benzi tematice numerotate roman                               */}
      {/* ------------------------------------------------------------ */}
      {bands.map((band, index) => (
        <Fragment key={band.key}>
          <section className="border-t border-line">
            <Container className="py-12 lg:py-16">
              <SectionHead
                kicker={t(`home.bands.${band.key}.kicker`)}
                title={t(`home.bands.${band.key}.title`)}
                href={band.href}
                roman={index + 1}
                locale={locale}
              />
              {/* primul card e „emphasis" și ocupă două coloane: numărul de
                  coloane urmează numărul de materiale, ca banda să nu rămână
                  cu o celulă goală când o categorie are puține articole */}
              <div
                className={`mt-8 grid gap-8 sm:grid-cols-2 ${
                  band.items.length >= 3
                    ? "lg:grid-cols-4"
                    : band.items.length === 2
                      ? "lg:grid-cols-3"
                      : "lg:grid-cols-2"
                }`}
              >
                {band.items.map((article, position) => (
                  <Card
                    key={article.id}
                    article={article}
                    locale={locale}
                    variant="standard"
                    emphasis={position === 0}
                  />
                ))}
              </div>
            </Container>
          </section>

          {/* În flux: reclama stă între banda „Economie" și următoarea */}
          {index === infeedAfter ? (
            <Container>
              <AdSlot zoneKey="home_infeed" className="py-10" />
            </Container>
          ) : null}
        </Fragment>
      ))}

      {/* ------------------------------------------------------------ */}
      {/* Opinie & Analize — carduri-citat                              */}
      {/* ------------------------------------------------------------ */}
      {opinions.length > 0 ? (
        <section className="border-t border-line bg-coal-2/70">
          <Container className="py-14 lg:py-20">
            <SectionHead
              kicker={t("home.bands.opinion.kicker")}
              title={t("home.bands.opinion.title")}
              href="/opinie"
              roman={BANDS.length + 1}
              locale={locale}
            />
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {opinions.map((article) => (
                <Card
                  key={article.id}
                  article={article}
                  locale={locale}
                  variant="quote"
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Fluxul editorial + bara laterală                              */}
      {/* ------------------------------------------------------------ */}
      <section className="border-t border-line">
        <Container className="py-14 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
            <div>
              <SectionHead
                kicker={t("home.latestSection.kicker")}
                title={t("home.latestSection.title")}
                roman={BANDS.length + 2}
                locale={locale}
              />
              <div className="mt-8 flex flex-col divide-y divide-line">
                {latest.map((article) => (
                  <div key={article.id} className="py-6 first:pt-0 last:pb-0">
                    <Card article={article} locale={locale} variant="row" />
                  </div>
                ))}
              </div>
            </div>

            <Sidebar
              widgets={sidebar.widgets}
              mostRead={sidebar.mostRead}
              pricing={settings?.pricing ?? null}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
