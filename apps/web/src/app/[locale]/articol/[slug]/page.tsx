import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AdSlot, splitAfterParagraph } from "@/components/ads";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Cover,
  Prose,
  ShareRow,
} from "@/components/ui";
import { Sidebar } from "@/components/widgets";
import { Link } from "@/i18n/navigation";
import { formatDate, formatDateTime, formatNumber, truncate } from "@/lib/format";
import type { Locale, SettingsDto } from "@/lib/types";
import JsonLd from "../../../_lib/JsonLd";
import {
  getArticle,
  getReaderToken,
  getRelated,
  getSettings,
  getSidebarData,
} from "../../../_lib/data";
import { buildMetadata } from "../../../_lib/seo";
import { absoluteUrl, articleOgImageUrl, organizationNode } from "../../../_lib/site";
import ViewTracker from "./ViewTracker";

export const revalidate = 300;

interface RouteParams {
  locale: string;
  slug: string;
}

/* ------------------------------------------------------------------ */

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
  const article = await getArticle(slug, locale, null);
  if (!article) return {};

  return buildMetadata({
    locale,
    path: `/articol/${slug}`,
    title: article.title,
    description: truncate(article.summary, 155),
    type: "article",
    image: articleOgImageUrl(locale, slug),
    imageAlt: article.title,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: [article.author.name],
    section: article.categoryName,
    tags: article.tags,
  });
}

/* ------------------------------------------------------------------ */

function priceOf(
  settings: SettingsDto | null,
  key: "premiumMonthly" | "premiumAnnual",
): number {
  const value = settings?.pricing?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return key === "premiumMonthly" ? 149 : 1490;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const readerToken = await getReaderToken();
  const article = await getArticle(slug, locale, readerToken);
  if (!article) notFound();

  const t = await getTranslations({ locale });
  const [related, sidebar, settings] = await Promise.all([
    getRelated(slug, locale, 3),
    getSidebarData(locale),
    getSettings(),
  ]);

  const url = absoluteUrl(locale, `/articol/${slug}`);
  const currency = settings?.pricing?.currency ?? "MDL";
  const monthly = priceOf(settings, "premiumMonthly");
  const annual = priceOf(settings, "premiumAnnual");
  const benefits = [
    t("article.paywall.benefit1"),
    t("article.paywall.benefit2"),
    t("article.paywall.benefit3"),
  ];

  // Reclama din corpul textului (ADS-SPEC §3): după al treilea paragraf.
  // La un articol trunchiat de paywall nu tăiem în text — fragmentul e scurt
  // și se termină oricum într-o estompare — ci o punem înaintea casetei.
  // Dacă textul are mai puțin de trei paragrafe de nivel superior, `split`
  // este null și reclama coboară sub conținut, fără să atingă marcajul.
  const contentSplit = article.contentIsTruncated
    ? null
    : splitAfterParagraph(article.content, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.summary,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: locale === "ru" ? "ru-RU" : "ro-RO",
        datePublished: article.publishedAt,
        dateModified: article.updatedAt ?? article.publishedAt,
        articleSection: article.categoryName,
        keywords: article.tags.join(", "),
        wordCount: article.content
          .replace(/<[^>]*>/g, " ")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
        image: [articleOgImageUrl(locale, slug)],
        author: {
          "@type": "Person",
          name: article.author.name,
          url: absoluteUrl(locale, `/autor/${article.author.slug}`),
          jobTitle: article.author.role,
        },
        publisher: organizationNode(locale, settings),
        isAccessibleForFree: !article.premium,
        ...(article.premium
          ? {
              hasPart: {
                "@type": "WebPageElement",
                isAccessibleForFree: false,
                cssSelector: ".corbul-premium-body",
              },
            }
          : {}),
        citation: article.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.label,
          url: source.url,
        })),
      },
      {
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
            name: article.categoryName,
            item: absoluteUrl(locale, `/${article.categorySlug}`),
          },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ViewTracker slug={slug} />

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
              <Link
                href={`/${article.categorySlug}`}
                className="transition-colors hover:text-gold"
              >
                {article.categoryName}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <article className="min-w-0">
            {/* -------------------------------------------------------- */}
            {/* Titlu, lede, meta                                        */}
            {/* -------------------------------------------------------- */}
            <header>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="cat" hue={article.categoryHue} locale={locale}>
                  {article.categoryName}
                </Badge>
                {article.breaking ? (
                  <Badge tone="breaking" locale={locale} />
                ) : null}
                {article.premium ? <Badge tone="premium" locale={locale} /> : null}
              </div>

              <h1 className="headline headline-tight mt-6 max-w-4xl text-4xl text-ivory md:text-5xl lg:text-6xl">
                {article.title}
              </h1>

              <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed text-fog md:text-2xl">
                {article.summary}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-line py-5">
                <Link
                  href={`/autor/${article.author.slug}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar
                    initials={article.author.initials}
                    name={article.author.name}
                    size={40}
                  />
                  <span className="font-sans text-sm">
                    <span className="block font-semibold text-ivory transition-colors group-hover:text-gold">
                      {article.author.name}
                    </span>
                    <span className="block text-xs text-mist">
                      {article.author.role}
                    </span>
                  </span>
                </Link>

                <span className="h-8 w-px bg-line" aria-hidden="true" />

                <div className="meta flex flex-wrap items-center gap-x-5 gap-y-2 uppercase tracking-[0.14em]">
                  <time dateTime={article.publishedAt}>
                    {formatDateTime(article.publishedAt, locale)}
                  </time>
                  <span>{t("common.minRead", { count: article.readMin })}</span>
                  <span>{t("common.views", { count: article.views })}</span>
                  {article.updatedAt ? (
                    <span className="text-gold">
                      {t("article.updated", {
                        date: formatDate(article.updatedAt, locale),
                      })}
                    </span>
                  ) : null}
                </div>
              </div>
            </header>

            {/* -------------------------------------------------------- */}
            {/* Copertă                                                  */}
            {/* -------------------------------------------------------- */}
            <div className="mt-10">
              <Cover
                seed={article.coverSeed}
                hue={article.categoryHue}
                title={article.title}
                ratio="16 / 9"
              />
            </div>

            {/* -------------------------------------------------------- */}
            {/* Corpul articolului (+ estomparea de paywall)             */}
            {/* -------------------------------------------------------- */}
            <div
              className={`corbul-premium-body relative mt-12 ${
                article.contentIsTruncated ? "pb-28" : ""
              }`}
            >
              {contentSplit ? (
                <>
                  <Prose html={contentSplit.head} size="lg" dropcap />
                  <AdSlot zoneKey="article_inline" className="py-10" />
                  <Prose html={contentSplit.tail} size="lg" />
                </>
              ) : (
                <Prose html={article.content} size="lg" dropcap />
              )}

              {article.contentIsTruncated ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-obsidian/85 to-obsidian"
                />
              ) : null}
            </div>

            {/* text prea scurt pentru o tăietură curată, sau trunchiat de
                paywall: reclama stă sub conținut, înaintea casetei */}
            {contentSplit ? null : (
              <AdSlot zoneKey="article_inline" className="pt-10" />
            )}

            {/* -------------------------------------------------------- */}
            {/* Paywall                                                  */}
            {/* -------------------------------------------------------- */}
            {article.contentIsTruncated ? (
              <section
                aria-labelledby="paywall"
                className="double-frame mt-2 px-6 py-10 text-center md:px-12"
              >
                <p className="kicker">{t("article.paywall.kicker")}</p>
                <h2
                  id="paywall"
                  className="headline mt-4 text-3xl text-ivory md:text-4xl"
                >
                  {t("article.paywall.title")}
                </h2>
                <div className="rule-gold-center mx-auto mt-5 w-20" />
                <p className="mx-auto mt-6 max-w-xl font-serif text-base leading-relaxed text-fog">
                  {t("article.paywall.text")}
                </p>

                <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3">
                      <span aria-hidden="true" className="mt-1 text-gold">
                        ◆
                      </span>
                      <span className="font-serif text-sm leading-relaxed text-fog">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-px bg-line">
                  <div className="bg-coal-2 px-4 py-5">
                    <dt className="sr-only">{t("subscribe.plans.monthly.name")}</dt>
                    <dd className="headline text-xl text-gold">
                      {t("article.paywall.monthly", {
                        price: `${formatNumber(monthly, locale)} ${currency}`,
                      })}
                    </dd>
                  </div>
                  <div className="bg-coal-2 px-4 py-5">
                    <dt className="sr-only">{t("subscribe.plans.annual.name")}</dt>
                    <dd className="headline text-xl text-gold">
                      {t("article.paywall.annual", {
                        price: `${formatNumber(annual, locale)} ${currency}`,
                      })}
                    </dd>
                    <p className="meta mt-2 text-sage">
                      {t("article.paywall.annualNote")}
                    </p>
                  </div>
                </dl>

                <div className="mt-8 flex justify-center">
                  <Button variant="gold" href="/abonament" size="lg">
                    {t("article.paywall.cta")}
                  </Button>
                </div>

                <p className="mx-auto mt-6 max-w-md font-sans text-xs leading-relaxed text-mist">
                  {t("article.paywall.note")}
                </p>
              </section>
            ) : null}

            {/* -------------------------------------------------------- */}
            {/* TrustBox — semnal EEAT                                   */}
            {/* -------------------------------------------------------- */}
            <section
              aria-labelledby="trust"
              className="mt-14 border-l-2 border-gold bg-coal/70 px-6 py-7"
            >
              <div className="flex items-start gap-3">
                <svg
                  viewBox="0 0 20 20"
                  width="20"
                  height="20"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-gold"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M10 1.6 3 4.4v5.1c0 4 2.9 7.4 7 8.9 4.1-1.5 7-4.9 7-8.9V4.4L10 1.6Z" />
                  <path d="m6.8 9.9 2.2 2.2 4.2-4.4" strokeLinecap="round" />
                </svg>
                <div className="min-w-0">
                  <h2 id="trust" className="kicker text-sm">
                    {t("article.trust.title")}
                  </h2>
                  <p className="mt-3 font-serif text-sm leading-relaxed text-fog">
                    {t("article.trust.text")}
                  </p>

                  <h3 className="kicker kicker-muted mt-6">
                    {t("article.sourcesTitle")}
                  </h3>
                  {article.sources.length > 0 ? (
                    <>
                      <p className="meta mt-2">{t("article.sourcesNote")}</p>
                      <ol className="mt-3 space-y-2">
                        {article.sources.map((source, index) => (
                          <li
                            key={`${source.url}-${index}`}
                            className="flex gap-3 font-sans text-sm text-fog"
                          >
                            <span className="shrink-0 tabular-nums text-mist">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="underline decoration-line-2 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
                            >
                              {source.label}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="mt-3 font-sans text-sm text-mist">
                      {t("article.sourcesNote")}
                    </p>
                  )}

                  <p className="mt-6">
                    <Link href="/despre" className="link-gold text-xs uppercase tracking-[0.16em]">
                      {t("about.principles.title")} →
                    </Link>
                  </p>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------------- */}
            {/* Etichete + distribuire                                   */}
            {/* -------------------------------------------------------- */}
            {article.tags.length > 0 ? (
              <section className="mt-12">
                <h2 className="kicker kicker-muted">{t("article.tags")}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/cautare?q=${encodeURIComponent(tag)}`}
                        className="inline-block border border-line px-3 py-1.5 font-sans text-xs text-fog transition-colors hover:border-gold hover:text-gold"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-12 border-t border-line pt-8">
              <ShareRow
                url={url}
                title={article.title}
                label={t("article.share")}
                locale={locale}
              />
            </section>

            {/* -------------------------------------------------------- */}
            {/* Caseta autorului                                         */}
            {/* -------------------------------------------------------- */}
            <section aria-labelledby="autor" className="mt-12 border-t border-line pt-10">
              <h2 id="autor" className="kicker kicker-muted">
                {t("article.aboutAuthor")}
              </h2>
              <div className="mt-6 flex flex-col gap-6 bg-coal/70 p-6 sm:flex-row sm:items-start">
                <Avatar
                  initials={article.author.initials}
                  name={article.author.name}
                  size={72}
                />
                <div className="min-w-0">
                  <p className="headline text-2xl text-ivory">
                    {article.author.name}
                  </p>
                  <p className="kicker mt-1">{article.author.role}</p>
                  <p className="mt-4 font-serif text-sm leading-relaxed text-fog">
                    {article.author.bio}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.16em]">
                    <Link
                      href={`/autor/${article.author.slug}`}
                      className="link-gold"
                    >
                      {t("article.moreByAuthor")} →
                    </Link>
                    {article.author.email ? (
                      <a
                        href={`mailto:${article.author.email}`}
                        className="text-mist transition-colors hover:text-gold"
                      >
                        {article.author.email}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------------- */}
            {/* Articole conexe                                          */}
            {/* -------------------------------------------------------- */}
            {related.length > 0 ? (
              <section aria-labelledby="conexe" className="mt-14 border-t border-line pt-10">
                <p className="kicker">{t("article.relatedKicker")}</p>
                <h2 id="conexe" className="headline mt-3 text-3xl text-ivory">
                  {t("article.related")}
                </h2>
                <div className="mt-8 grid gap-8 sm:grid-cols-3">
                  {related.map((item) => (
                    <Card
                      key={item.id}
                      article={item}
                      locale={locale}
                      variant="standard"
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </article>

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
