import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Card, Container, EmptyState, Pagination } from "@/components/ui";
import { Sidebar } from "@/components/widgets";
import type { Locale } from "@/lib/types";
import { getSettings, getSidebarData, searchArticles } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";

export const revalidate = 60;

/** Mărimea paginii impusă de API (`DEFAULT_PER_PAGE` în search.service). */
const PER_PAGE = 12;

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
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const t = await getTranslations({ locale });

  return {
    ...buildMetadata({
      locale,
      path: "/cautare",
      title: q ? t("search.resultsFor", { query: q }) : t("search.metaTitle"),
      description: t("search.subtitle"),
    }),
    // paginile de rezultate nu se indexează; canonicalul rămâne /cautare
    robots: { index: false, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/* Evidențierea termenului căutat                                      */
/* ------------------------------------------------------------------ */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Marchează termenii căutați în text.
 *
 * Potrivirea se face pe tulpină — ultimele două litere ale unui cuvânt lung
 * cad, iar restul se completează cu litere — ca „licitație" să prindă și
 * „licitația", „licitațiilor". Fără tulpină, flexiunea românească ar face
 * evidențierea aproape inutilă.
 */
function highlight(text: string, query: string): ReactNode {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 6);
  if (terms.length === 0 || !text) return text;

  const group = `(${terms
    .map((term) => {
      const stem = term.length >= 6 ? term.slice(0, term.length - 2) : term;
      return `${escapeRegExp(stem)}[\\p{L}]*`;
    })
    .join("|")})`;

  let splitter: RegExp;
  try {
    splitter = new RegExp(group, "giu");
  } catch {
    return text;
  }
  if (!new RegExp(group, "iu").test(text)) return text;

  // `String.split` cu un singur grup de captură pune potrivirile pe pozițiile impare
  return text.split(splitter).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${index}-${part}`} className="bg-gold/20 px-0.5 text-gold">
        {part}
      </mark>
    ) : (
      <span key={`${index}-${part}`}>{part}</span>
    ),
  );
}

/* ------------------------------------------------------------------ */

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const query = await searchParams;
  const q = (typeof query.q === "string" ? query.q : "").trim();
  const page = pageNumber(query.page);

  const t = await getTranslations({ locale });
  const [results, sidebar, settings] = await Promise.all([
    searchArticles(q, locale, page),
    getSidebarData(locale),
    getSettings(),
  ]);

  // API-ul întoarce {items, total}; numărul de pagini se calculează aici (SPEC §10ter)
  const pages = Math.max(1, Math.ceil(results.total / PER_PAGE));
  if (page > pages) notFound();

  return (
    <Container className="py-10 lg:py-16">
      <header className="border-b border-line pb-10">
        <p className="kicker">{t("search.kicker")}</p>
        <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-6xl">
          {t("search.title")}
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-fog">
          {t("search.subtitle")}
        </p>

        {/* formular GET simplu: funcționează și fără JavaScript */}
        <form
          action={`/${locale}/cautare`}
          method="get"
          role="search"
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="q" className="sr-only">
            {t("search.placeholder")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoComplete="off"
            minLength={2}
            placeholder={t("search.placeholder")}
            className="min-w-0 flex-1 border border-line bg-coal px-5 py-4 font-serif text-lg text-ivory outline-none transition-colors placeholder:text-mist focus:border-gold"
          />
          <button
            type="submit"
            className="press border border-gold-solid bg-gold-solid px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-on-gold transition-colors hover:border-gold-solid-2 hover:bg-gold-solid-2"
          >
            {t("search.submit")}
          </button>
        </form>

        <p className="meta mt-3">{t("search.hint")}</p>

        {q ? (
          <p className="mt-6 font-sans text-sm text-fog">
            {t("search.resultsFor", { query: q })}
            <span className="mx-3 text-line-2">·</span>
            <span className="text-mist">
              {t("search.count", { count: results.total })}
            </span>
          </p>
        ) : null}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div>
          {!q ? (
            <div className="border border-line bg-coal/60 px-6 py-10">
              <h2 className="headline text-2xl text-ivory">
                {t("search.start.title")}
              </h2>
              <p className="mt-4 max-w-2xl font-serif leading-relaxed text-fog">
                {t("search.start.text")}
              </p>
            </div>
          ) : results.items.length === 0 ? (
            <EmptyState
              title={t("search.empty.title")}
              description={t("search.empty.text", { query: q })}
            />
          ) : (
            <>
              <ol className="flex flex-col divide-y divide-line">
                {results.items.map((article) => (
                  <li key={article.id} className="py-7 first:pt-0 last:pb-0">
                    {/* rezumatul este scos din card și randat aici, integral și
                        cu termenul evidențiat (SPEC §7); titlurile sunt h2, ca
                        ierarhia să nu sară de la h1 direct la h3 */}
                    <Card
                      article={article}
                      locale={locale}
                      variant="row"
                      headingLevel={2}
                      showSummary={false}
                    />
                    {article.summary ? (
                      <p className="mt-4 border-l border-gold/40 pl-4 font-serif text-[0.9375rem] leading-relaxed text-fog">
                        {highlight(article.summary, q)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>

              {pages > 1 ? (
                <div className="mt-14 border-t border-line pt-8">
                  <Pagination
                    page={page}
                    pages={pages}
                    baseHref="/cautare"
                    query={{ q }}
                    locale={locale}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <Sidebar
          widgets={sidebar.widgets}
          mostRead={sidebar.mostRead}
          pricing={settings?.pricing ?? null}
        />
      </div>
    </Container>
  );
}
