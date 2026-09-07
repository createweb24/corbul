import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/app/_lib/JsonLd";
import { buildMetadata } from "@/app/_lib/seo";
import { absoluteUrl, SITE_NAME } from "@/app/_lib/site";
import { Container, Divider } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { safeFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Locale, WidgetsDto } from "@/lib/types";
import {
  eurRateOf,
  FALLBACK_RATES,
  resolveToolId,
  TOOL_IDS,
  type ToolId,
} from "./components/calc-lib";
import ToolsWorkbench from "./components/ToolsWorkbench";

/**
 * Instrumente fiscale (SPEC §8).
 *
 * Pagina este un container server: aduce o singură dată cursul BNM din
 * `/api/widgets` (aceeași fereastră de 15 minute ca widgeturile din bara
 * laterală) și îl pasează calculatoarelor client. Dacă API-ul tace,
 * `safeFetch` întoarce `null` și trecem pe cursurile de rezervă, marcate ca
 * atare — pagina nu are voie să cadă din cauza unui serviciu extern.
 *
 * Fila activă vine din `?tool=`: citirea parametrului pe server elimină
 * pâlpâirea la deschiderea unui link direct către un calculator anume
 * (prețul este randarea dinamică a acestei rute, nu și a celorlalte).
 */

const PATH = "/instrumente";

interface RouteParams {
  locale: string;
}

interface RouteSearch {
  tool?: string | string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "tools" });
  return buildMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ToolsPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearch>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const typedLocale: Locale = locale;
  const { tool } = await searchParams;
  const requested = Array.isArray(tool) ? tool[0] : tool;
  const initialTool: ToolId = resolveToolId(requested) ?? TOOL_IDS[0];

  const t = await getTranslations({ locale, namespace: "tools" });

  const widgets = await safeFetch<WidgetsDto>("/widgets", { revalidate: 900 });
  const rates =
    widgets && widgets.rates.length > 0 ? widgets.rates : FALLBACK_RATES;
  const stale = !widgets || widgets.stale;
  // data cursului efectiv folosit de BNM (poate fi o zi anterioară, când
  // banca nu a publicat încă), nu momentul la care API-ul l-a descărcat
  const ratesIso = widgets ? (widgets.ratesDate ?? widgets.fetchedAt) : null;
  const ratesDate = ratesIso ? formatDate(ratesIso, typedLocale) : null;

  const pageUrl = absoluteUrl(typedLocale, PATH);

  return (
    <Container className="py-12 lg:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              "@id": `${pageUrl}#app`,
              name: t("metaTitle"),
              description: t("metaDescription"),
              url: pageUrl,
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              inLanguage: typedLocale,
              isAccessibleForFree: true,
              offers: {
                "@type": "Offer",
                price: 0,
                priceCurrency: "MDL",
              },
              featureList: TOOL_IDS.map((id) => t(`tabs.${id}`)),
              publisher: { "@type": "Organization", name: SITE_NAME },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: t("breadcrumbHome"),
                  item: absoluteUrl(typedLocale),
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: t("title"),
                  item: pageUrl,
                },
              ],
            },
          ],
        }}
      />

      <header className="max-w-3xl">
        <nav aria-label={t("breadcrumbLabel")} className="mb-5">
          <ol className="meta flex flex-wrap items-center gap-2 uppercase tracking-[0.14em]">
            <li>
              <Link
                href="/"
                className="transition-colors duration-200 hover:text-gold"
              >
                {t("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true" className="text-line-2">
              /
            </li>
            <li className="text-fog">{t("title")}</li>
          </ol>
        </nav>

        <p className="kicker">{t("kicker")}</p>
        <h1 className="headline headline-tight mt-3 text-[2.6rem] text-ivory sm:text-[3.4rem]">
          {t("title")}
        </h1>
        <Divider variant="gold" className="mt-5 w-40" />
        <p className="mt-5 font-serif text-[1.0625rem] leading-relaxed text-fog">
          {t("subtitle")}
        </p>
        <p className="mt-3 font-sans text-[0.75rem] leading-relaxed text-mist">
          {stale || !ratesDate
            ? t("ratesFallback")
            : t("ratesLive", { date: ratesDate })}
        </p>
      </header>

      <div className="mt-10 lg:mt-12">
        <ToolsWorkbench
          locale={typedLocale}
          initialTool={initialTool}
          rates={rates}
          eurRate={eurRateOf(rates)}
          ratesDate={ratesDate}
          stale={stale}
          currentYear={new Date().getFullYear()}
        />
      </div>

      <section className="mt-12 border-t border-line pt-7">
        <h2 className="kicker">{t("aboutTitle")}</h2>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <p className="font-serif text-[0.9375rem] leading-relaxed text-fog">
            {t("aboutBody")}
          </p>
          <p className="font-serif text-[0.9375rem] leading-relaxed text-fog">
            {t.rich("aboutContact", {
              link: (chunks) => (
                <Link href="/contact" className="link-gold underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </section>
    </Container>
  );
}
