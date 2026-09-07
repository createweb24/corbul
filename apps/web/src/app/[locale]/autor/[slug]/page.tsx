import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Avatar, Card, Container, EmptyState } from "@/components/ui";
import { Sidebar } from "@/components/widgets";
import { Link } from "@/i18n/navigation";
import { truncate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import JsonLd from "../../../_lib/JsonLd";
import { getAuthor, getSettings, getSidebarData } from "../../../_lib/data";
import { buildMetadata } from "../../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../../_lib/site";

export const revalidate = 900;

interface RouteParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);
  const author = await getAuthor(slug, locale);
  if (!author) return {};

  return buildMetadata({
    locale,
    path: `/autor/${slug}`,
    title: `${author.name} — ${author.role}`,
    description: truncate(author.bio, 155),
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const author = await getAuthor(slug, locale);
  if (!author) notFound();

  const t = await getTranslations({ locale });
  const [sidebar, settings] = await Promise.all([
    getSidebarData(locale),
    getSettings(),
  ]);
  const articles = Array.isArray(author.articles) ? author.articles : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(locale, `/autor/${slug}`),
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role,
      description: author.bio,
      email: author.email,
      url: absoluteUrl(locale, `/autor/${slug}`),
      worksFor: organizationNode(locale, settings),
    },
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
          name: t("team.title"),
          item: absoluteUrl(locale, "/echipa"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: author.name,
          item: absoluteUrl(locale, `/autor/${slug}`),
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
            <li>
              <Link href="/echipa" className="transition-colors hover:text-gold">
                {t("team.title")}
              </Link>
            </li>
          </ol>
        </nav>

        <header className="mt-8 flex flex-col gap-7 border-b border-line pb-10 sm:flex-row sm:items-start sm:gap-9">
          <Avatar initials={author.initials} name={author.name} size={104} />
          <div className="min-w-0">
            <h1 className="headline headline-tight text-4xl text-ivory md:text-5xl">
              {author.name}
            </h1>
            <p className="kicker mt-2">{author.role}</p>
            <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-fog">
              {author.bio}
            </p>
            <div className="meta mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 uppercase tracking-[0.16em]">
              {author.email ? (
                <a
                  href={`mailto:${author.email}`}
                  className="transition-colors hover:text-gold"
                >
                  {author.email}
                </a>
              ) : null}
              <span>
                {t("team.articleCount", {
                  count: author.articleCount ?? articles.length,
                })}
              </span>
            </div>
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div>
            <h2 className="kicker kicker-muted">
              {t("team.byAuthor", { name: author.name })}
            </h2>

            {articles.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  title={t("team.noArticles")}
                  description={t("errors.apiDown")}
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-col divide-y divide-line">
                {articles.map((article) => (
                  <div key={article.id} className="py-7 first:pt-0 last:pb-0">
                    <Card article={article} locale={locale} variant="row" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Sidebar
            widgets={sidebar.widgets}
            mostRead={sidebar.mostRead}
            pricing={settings?.pricing ?? null}
          />
        </div>
      </Container>
    </>
  );
}
