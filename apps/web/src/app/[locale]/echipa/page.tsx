import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar, Container, EmptyState } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { getAuthors } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl } from "../../_lib/site";

export const revalidate = 3600;

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
    path: "/echipa",
    title: t("team.metaTitle"),
    description: t("team.metaDescription"),
  });
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const authors = await getAuthors(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("team.title"),
    description: t("team.subtitle"),
    url: absoluteUrl(locale, "/echipa"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: authors.map((author, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Person",
          name: author.name,
          jobTitle: author.role,
          description: author.bio,
          email: author.email,
          url: absoluteUrl(locale, `/autor/${author.slug}`),
        },
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <Container className="py-14 lg:py-20">
        <header className="max-w-3xl border-b border-line pb-10">
          <p className="kicker">{t("team.kicker")}</p>
          <h1 className="headline headline-tight mt-4 text-5xl text-ivory md:text-6xl">
            {t("team.title")}
          </h1>
          <div className="rule-gold mt-7 w-32" />
          <p className="mt-7 font-serif text-lg leading-relaxed text-fog">
            {t("team.subtitle")}
          </p>
        </header>

        {authors.length === 0 ? (
          <div className="py-20">
            <EmptyState title={t("team.empty")} description={t("errors.apiDown")} />
          </div>
        ) : (
          <ul className="mt-12 grid gap-px bg-line md:grid-cols-2">
            {authors.map((author) => (
              <li key={author.slug} className="bg-coal p-7 md:p-9">
                <div className="flex items-start gap-5">
                  <Avatar
                    initials={author.initials}
                    name={author.name}
                    size={64}
                  />
                  <div className="min-w-0">
                    <h2 className="headline text-2xl text-ivory">
                      <Link
                        href={`/autor/${author.slug}`}
                        className="title-link transition-colors hover:text-gold"
                      >
                        {author.name}
                      </Link>
                    </h2>
                    <p className="kicker mt-1">{author.role}</p>
                    {typeof author.articleCount === "number" ? (
                      <p className="meta mt-1">
                        {t("team.articleCount", { count: author.articleCount })}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-6 font-serif leading-relaxed text-fog">
                  {author.bio}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.16em]">
                  <Link href={`/autor/${author.slug}`} className="link-gold">
                    {t("team.viewArticles")} →
                  </Link>
                  {author.email ? (
                    <a
                      href={`mailto:${author.email}`}
                      className="text-mist transition-colors hover:text-gold"
                    >
                      {t("team.contact")}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
