import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button, Container, RavenMark } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/types";
import JsonLd from "../../../_lib/JsonLd";
import { getSettings } from "../../../_lib/data";
import { buildMetadata } from "../../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../../_lib/site";
import {
  ADS_EMAIL,
  adsText,
  MEDIA_KIT_STATS,
  READER_PROFILE,
} from "../_data/copy";
import { localizedAdServices } from "../_data/services";
import { getAdZones, zoneName, zonePriceMdl } from "../_data/zones";

/**
 * `/publicitate/media-kit` — cifrele de audiență, profilul cititorului,
 * formatele, tarifele și condițiile editoriale, pe o singură pagină
 * (ADS-SPEC §7).
 */

export const revalidate = 3600;

const TERMS = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;

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
  const s = adsText(locale, t);
  return buildMetadata({
    locale,
    path: "/publicitate/media-kit",
    title: s("ads.mediaKit.metaTitle"),
    description: s("ads.mediaKit.metaDescription"),
    absoluteTitle: true,
  });
}

export default async function MediaKitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const s = adsText(locale, t);
  const [settings, zones] = await Promise.all([getSettings(), getAdZones()]);
  const services = localizedAdServices(locale);
  const ru = locale === "ru";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: s("ads.mediaKit.metaTitle"),
    description: s("ads.mediaKit.metaDescription"),
    url: absoluteUrl(locale, "/publicitate/media-kit"),
    publisher: organizationNode(locale, settings),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ------------------------------------------------------------ */}
      <section className="border-b border-line bg-coal/50">
        <Container className="py-16 lg:py-24">
          <nav
            aria-label={s("ads.index.title")}
            className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-mist"
          >
            <Link
              href="/publicitate"
              className="transition-colors hover:text-gold"
            >
              {s("ads.index.title")}
            </Link>
          </nav>

          <div className="mt-8 max-w-4xl">
            <div className="flex items-center gap-4">
              <RavenMark size={32} />
              <p className="kicker">{s("ads.kicker")}</p>
            </div>
            <h1 className="headline headline-tight mt-6 text-5xl text-ivory md:text-7xl">
              {s("ads.mediaKit.title")}
            </h1>
            <div className="rule-gold mt-8 w-40" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-fog md:text-2xl">
              {s("ads.mediaKit.subtitle")}
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Audiență                                                      */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="audienta">
        <Container className="py-16 lg:py-20">
          <h2
            id="audienta"
            className="headline headline-tight text-4xl text-ivory md:text-5xl"
          >
            {s("ads.mediaKit.audienceTitle")}
          </h2>

          <dl className="mt-10 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {MEDIA_KIT_STATS.map((stat) => (
              <div key={stat.value + stat.labelRo} className="bg-coal px-6 py-9">
                <dt className="font-sans text-xs uppercase tracking-[0.16em] text-mist">
                  {ru ? stat.labelRu : stat.labelRo}
                </dt>
                <dd className="headline mt-3 text-4xl tabular-nums text-gold">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 max-w-3xl font-sans text-xs leading-relaxed text-mist">
            {s("ads.mediaKit.audienceNote")}
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Profilul cititorului                                          */}
      {/* ------------------------------------------------------------ */}
      <section
        aria-labelledby="cititor"
        className="border-y border-line bg-coal-2/60"
      >
        <Container className="py-16 lg:py-24">
          <div className="max-w-3xl">
            <h2
              id="cititor"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {s("ads.mediaKit.readerTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.mediaKit.readerNote")}
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2 xl:gap-14">
            {READER_PROFILE.map((group) => (
              <section key={group.titleRo}>
                <h3 className="kicker kicker-muted">
                  {ru ? group.titleRu : group.titleRo}
                </h3>
                <ul className="mt-6 space-y-4">
                  {group.rows.map((row) => (
                    <li key={row.labelRo}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-sans text-sm text-fog">
                          {ru ? row.labelRu : row.labelRo}
                        </span>
                        <span className="font-sans text-sm tabular-nums text-gold">
                          {formatNumber(row.share, locale)}%
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1 w-full bg-line"
                        role="presentation"
                      >
                        <div
                          className="h-1 bg-gold"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Formate disponibile                                           */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="formate">
        <Container className="py-16 lg:py-20">
          <h2
            id="formate"
            className="headline headline-tight text-4xl text-ivory md:text-5xl"
          >
            {s("ads.mediaKit.formatsTitle")}
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="sr-only">
                {s("ads.mediaKit.formatsTitle")}
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th
                    scope="col"
                    className="py-3 pr-6 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-mist"
                  >
                    {s("ads.zones.zone")}
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-6 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-mist"
                  >
                    {s("ads.zones.size")}
                  </th>
                  <th
                    scope="col"
                    className="py-3 text-right font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-mist"
                  >
                    {s("ads.zones.price")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const price = zonePriceMdl(zone);
                  return (
                    <tr key={zone.key} className="border-b border-line">
                      <th
                        scope="row"
                        className="py-4 pr-6 font-sans text-sm font-semibold text-ivory"
                      >
                        {zoneName(zone, locale)}
                        <span className="mt-1 block font-normal text-xs tracking-[0.14em] text-mist">
                          {zone.key}
                        </span>
                      </th>
                      <td className="py-4 pr-6 font-sans text-sm tabular-nums text-fog">
                        {formatNumber(zone.width, locale)}
                        <span className="px-1 text-mist">×</span>
                        {formatNumber(zone.height, locale)}
                        <span className="ml-1 text-xs text-mist">px</span>
                      </td>
                      <td className="py-4 text-right font-sans text-sm tabular-nums text-gold">
                        {price === null ? (
                          <span className="text-mist">
                            {s("ads.zones.onRequest")}
                          </span>
                        ) : (
                          formatMoney(price, locale, "MDL")
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-3xl font-sans text-xs leading-relaxed text-mist">
            {s("ads.mediaKit.formatsNote")}
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Tarife                                                        */}
      {/* ------------------------------------------------------------ */}
      <section
        aria-labelledby="tarife"
        className="border-y border-line bg-coal/50"
      >
        <Container className="py-16 lg:py-20">
          <h2
            id="tarife"
            className="headline headline-tight text-4xl text-ivory md:text-5xl"
          >
            {s("ads.mediaKit.ratesTitle")}
          </h2>

          <ul className="mt-10 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <li key={service.slug} className="group bg-coal">
                <Link
                  href={`/publicitate/${service.slug}`}
                  className="flex h-full flex-col px-6 py-8 transition-colors duration-200 ease-editorial hover:bg-coal-2 md:px-8"
                >
                  <h3 className="headline text-xl text-ivory transition-colors duration-200 group-hover:text-gold">
                    {service.name}
                  </h3>
                  <p className="mt-3 flex-1 font-serif text-sm leading-relaxed text-fog">
                    {service.turnaround}
                  </p>
                  <span className="mt-5 font-sans text-xs uppercase tracking-[0.16em] text-mist">
                    {s("ads.priceFrom")}{" "}
                    <span className="tracking-normal text-gold">
                      {formatMoney(service.priceFromMdl, locale, "MDL")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-3xl font-sans text-xs leading-relaxed text-mist">
            {s("ads.mediaKit.ratesNote")}
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Condiții editoriale                                           */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="conditii">
        <Container className="py-16 lg:py-20">
          <div className="max-w-3xl">
            <h2
              id="conditii"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {s("ads.mediaKit.termsTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.mediaKit.termsIntro")}
            </p>
          </div>

          <ol className="roman-list roman-list-hang mt-12 grid gap-px bg-line md:grid-cols-2">
            {TERMS.map((key) => (
              <li key={key} className="bg-coal px-6 py-9 md:px-9">
                <p className="font-serif leading-relaxed text-fog">
                  {s(`ads.mediaKit.terms.${key}` as const)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Contact                                                       */}
      {/* ------------------------------------------------------------ */}
      <section className="border-t border-line bg-coal/50">
        <Container className="py-16 lg:py-20">
          <div className="double-frame px-6 py-12 text-center md:px-12">
            <h2 className="headline text-3xl text-ivory md:text-4xl">
              {s("ads.mediaKit.contactTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-serif leading-relaxed text-fog">
              {s("ads.mediaKit.contactBody")}
            </p>
            <p className="mt-6 font-sans text-sm text-mist">
              <a
                href={`mailto:${ADS_EMAIL}`}
                className="text-gold transition-colors hover:text-ivory"
              >
                {ADS_EMAIL}
              </a>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="gold" href="/contact?subiect=media-kit">
                {s("ads.quoteCta")}
              </Button>
              <Button variant="ghost" href="/publicitate">
                {s("ads.allServices")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
