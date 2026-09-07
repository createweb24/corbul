import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Card, Container, EmptyState, Pagination } from "@/components/ui";
import { Sidebar } from "@/components/widgets";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { categoryName, isCategorySlug } from "../../_lib/categories";
import {
  getArticles,
  getCategory,
  getSettings,
  getSidebarData,
} from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl } from "../../_lib/site";

export const revalidate = 300;

const PER_PAGE = 12;

interface RouteParams {
  locale: string;
  category: string;
}

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: raw, category } = await params;
  const locale = raw as Locale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);
  if (!isCategorySlug(category)) return {};

  const [t, dto, query] = await Promise.all([
    getTranslations({ locale }),
    getCategory(category, locale),
    searchParams,
  ]);
  const name = dto?.name ?? categoryName(category, locale);
  const page = pageNumber(query.page);
  const title = t("category.metaTitle", { name });

  // paginile 2+ au titlu și canonical proprii — altfel motoarele văd
  // N copii ale paginii 1
  return buildMetadata({
    locale,
    path: `/${category}`,
    canonicalPath: page > 1 ? `/${category}?page=${page}` : undefined,
    title: page > 1 ? `${title} — ${t("category.pageSuffix", { page })}` : title,
    description: dto?.description || t("home.description"),
  });
}

/* ------------------------------------------------------------------ */

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, category } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  if (!isCategorySlug(category)) notFound();

  const query = await searchParams;
  const page = pageNumber(query.page);

  const t = await getTranslations({ locale });
  const [dto, list, sidebar, settings] = await Promise.all([
    getCategory(category, locale),
    getArticles({ locale, category, page, perPage: PER_PAGE }),
    getSidebarData(locale),
    getSettings(),
  ]);

  // ?page= dincolo de ultima pagină nu este o „secțiune în lucru", ci un 404
  if (page > 1 && list.items.length === 0) notFound();

  const name = dto?.name ?? categoryName(category, locale);
  const [lead, ...rest] = page === 1 ? list.items : [];
  const grid = page === 1 ? rest : list.items;
  const total = list.total || dto?.count || 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: dto?.description || undefined,
    url: absoluteUrl(locale, `/${category}`),
    isPartOf: { "@type": "WebSite", url: absoluteUrl(locale, "") },
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
          name,
          item: absoluteUrl(locale, `/${category}`),
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <Container className="py-10 lg:py-14">
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
            <li className="text-fog">{name}</li>
          </ol>
        </nav>

        <header className="mt-6 border-b border-line pb-8">
          <p className="kicker">{t("category.kicker")}</p>
          <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-6xl">
            {name}
          </h1>
          {dto?.description ? (
            <p className="mt-5 max-w-3xl font-serif text-lg leading-relaxed text-fog">
              {dto.description}
            </p>
          ) : null}
          <p className="meta mt-5 uppercase tracking-[0.18em]">
            {t("category.count", { count: total })}
          </p>
        </header>

        {list.items.length === 0 ? (
          <div className="py-20">
            <EmptyState
              title={t("category.empty")}
              description={t("category.emptyText")}
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
            <div>
              {lead ? (
                <div className="border-b border-line pb-12">
                  <p className="kicker mb-5">{t("category.lead")}</p>
                  <Card article={lead} locale={locale} variant="lead" />
                </div>
              ) : null}

              {grid.length > 0 ? (
                <div className={lead ? "pt-12" : undefined}>
                  <div
                    className={`grid gap-10 sm:grid-cols-2 ${
                      grid.length >= 3 ? "xl:grid-cols-3" : ""
                    }`}
                  >
                    {grid.map((article) => (
                      <Card
                        key={article.id}
                        article={article}
                        locale={locale}
                        variant="standard"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {list.pages > 1 ? (
                <div className="mt-14 border-t border-line pt-8">
                  <Pagination
                    page={list.page}
                    pages={list.pages}
                    baseHref={`/${category}`}
                    locale={locale}
                  />
                </div>
              ) : null}
            </div>

            <Sidebar
              widgets={sidebar.widgets}
              mostRead={sidebar.mostRead}
              pricing={settings?.pricing ?? null}
            />
          </div>
        )}
      </Container>
    </>
  );
}
