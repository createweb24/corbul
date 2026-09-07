import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button, Container, RavenMark } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { getSettings } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../_lib/site";
import { ADS_EMAIL, adsText } from "./_data/copy";
import { formatServicePrice, localizedAdServices } from "./_data/services";
import { getAdZones, zoneName, zoneNote, zonePriceMdl } from "./_data/zones";

/**
 * `/publicitate` — pagina-index a secțiunii comerciale (ADS-SPEC §7).
 *
 * Intro, grila celor paisprezece servicii, formatele „la cerere" (bannere și
 * native ads), zonele de banner cu dimensiuni și preț
 * (din `GET /api/ads/zones`, cu grila din seed ca rezervă), argumentarea de
 * audiență și îndemnul spre departamentul comercial.
 */

export const revalidate = 3600;

const WHY = ["legal", "finance", "industry", "consulting"] as const;

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
    path: "/publicitate",
    title: s("ads.index.metaTitle"),
    description: s("ads.index.metaDescription14"),
    absoluteTitle: true,
  });
}

export default async function AdvertisingIndexPage({
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

  const organization = organizationNode(locale, settings);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: s("ads.index.metaTitle"),
        description: s("ads.index.metaDescription14"),
        url: absoluteUrl(locale, "/publicitate"),
        isPartOf: { "@id": `${absoluteUrl(locale, "")}/#website` },
        publisher: organization,
      },
      {
        "@type": "ItemList",
        name: s("ads.index.servicesTitle"),
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: services.length,
        itemListElement: services.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: service.name,
            description: service.lead,
            url: absoluteUrl(locale, `/publicitate/${service.slug}`),
            provider: { "@id": `${organization["@id"] as string}` },
            offers: {
              "@type": "Offer",
              price: service.priceFromEur,
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              // tarifele lunare se declară ca atare (UN/CEFACT: `MON` = lună)
              ...(service.priceUnit === "month"
                ? {
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: service.priceFromEur,
                      priceCurrency: "EUR",
                      unitCode: "MON",
                    },
                  }
                : {}),
            },
          },
        })),
      },
      organization,
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ------------------------------------------------------------ */}
      {/* Antet                                                         */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-line bg-coal/50">
        <Container className="py-16 lg:py-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4">
              <RavenMark size={34} />
              <p className="kicker">{s("ads.kicker")}</p>
            </div>
            <h1 className="headline headline-tight mt-6 text-5xl text-ivory md:text-7xl">
              {s("ads.index.title")}
            </h1>
            <div className="rule-gold mt-8 w-40" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-fog md:text-2xl">
              {s("ads.index.subtitle14")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="gold" href="/contact?subiect=publicitate">
                {s("ads.quoteCta")}
              </Button>
              <Button variant="ghost" href="/publicitate/media-kit">
                {s("ads.mediaKitLink")}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Cum lucrăm + ce nu se vinde                                   */}
      {/* ------------------------------------------------------------ */}
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="headline text-3xl text-ivory md:text-4xl">
              {s("ads.index.introTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.index.intro1")}
            </p>
            <p className="mt-5 font-serif text-lg leading-relaxed text-fog">
              {s("ads.index.intro2")}
            </p>
          </div>

          <aside className="border-l-2 border-gold pl-7">
            <h2 className="kicker">{s("ads.index.independenceTitle")}</h2>
            <p className="mt-5 font-serif leading-relaxed text-fog">
              {s("ads.index.independenceBody")}
            </p>
          </aside>
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Cele paisprezece servicii + formatele „la cerere"             */}
      {/* ------------------------------------------------------------ */}
      <section
        aria-labelledby="servicii"
        className="border-y border-line bg-coal-2/60"
      >
        <Container className="py-16 lg:py-24">
          <div className="max-w-3xl">
            <h2
              id="servicii"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {s("ads.index.servicesTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.index.servicesIntro")}
            </p>
          </div>

          <ul className="mt-12 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <li key={service.slug} className="group relative bg-coal">
                <Link
                  href={`/publicitate/${service.slug}`}
                  className="flex h-full flex-col px-6 py-9 transition-colors duration-200 ease-editorial hover:bg-coal-2 md:px-9"
                >
                  <span
                    aria-hidden="true"
                    className="block h-px w-10 bg-gold transition-all duration-200 ease-editorial group-hover:w-20"
                  />
                  <h3 className="headline mt-6 text-2xl text-ivory transition-colors duration-200 group-hover:text-gold">
                    {service.name}
                  </h3>
                  <p className="mt-4 flex-1 font-serif leading-relaxed text-fog">
                    {service.lead}
                  </p>
                  <span className="mt-7 flex items-baseline gap-2 font-sans text-xs uppercase tracking-[0.16em] text-mist">
                    {s("ads.priceFrom")}
                    <span className="text-sm font-semibold tracking-normal text-gold">
                      {formatServicePrice(
                        service,
                        locale,
                        s("ads.priceUnitMonth"),
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-sans text-xs leading-relaxed text-mist">
            {s("ads.priceNoteEur")}
          </p>
          <p className="mt-2 font-sans text-xs leading-relaxed text-mist">
            {s("ads.billingNote")}
          </p>

          {/* ---- La cerere: bannere și native ads ------------------- */}
          <div className="mt-16 border-t border-line pt-12">
            <h3
              id="la-cerere"
              className="headline text-2xl text-ivory md:text-3xl"
            >
              {s("ads.index.onRequestTitle")}
            </h3>
            <p className="mt-5 max-w-3xl font-serif leading-relaxed text-fog">
              {s("ads.index.onRequestIntro")}
            </p>

            <ul className="mt-10 grid gap-px bg-line md:grid-cols-2">
              <li className="bg-coal px-6 py-8 md:px-9">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h4 className="headline text-xl text-ivory">
                    {s("ads.index.onRequest.banners.title")}
                  </h4>
                  <span className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-gold">
                    {s("ads.priceOnRequest")}
                  </span>
                </div>
                <p className="mt-4 font-serif text-sm leading-relaxed text-fog">
                  {s("ads.index.onRequest.banners.body")}
                </p>
                <p className="mt-5 font-sans text-xs leading-relaxed text-mist">
                  {zones.map((zone) => zoneName(zone, locale)).join(" · ")}
                </p>
              </li>

              <li className="bg-coal px-6 py-8 md:px-9">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h4 className="headline text-xl text-ivory">
                    {s("ads.index.onRequest.native.title")}
                  </h4>
                  <span className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-gold">
                    {s("ads.priceOnRequest")}
                  </span>
                </div>
                <p className="mt-4 font-serif text-sm leading-relaxed text-fog">
                  {s("ads.index.onRequest.native.body")}
                </p>
              </li>
            </ul>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Zonele de banner                                              */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="zone">
        <Container className="py-16 lg:py-20">
          <div className="max-w-3xl">
            <h2
              id="zone"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {s("ads.index.zonesTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.index.zonesIntro")}
            </p>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <caption className="sr-only">
                {s("ads.index.zonesTitle")}
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
                  const note = zoneNote(zone, locale);
                  return (
                    <tr key={zone.key} className="border-b border-line align-top">
                      <th scope="row" className="py-5 pr-6 font-normal">
                        <span className="block font-sans text-sm font-semibold text-ivory">
                          {zoneName(zone, locale)}
                        </span>
                        {note ? (
                          <span className="mt-1.5 block max-w-md font-serif text-sm leading-relaxed text-mist">
                            {note}
                          </span>
                        ) : null}
                      </th>
                      <td className="py-5 pr-6 font-sans text-sm tabular-nums text-fog">
                        {formatNumber(zone.width, locale)}
                        <span className="px-1 text-mist">×</span>
                        {formatNumber(zone.height, locale)}
                        <span className="ml-1 text-xs text-mist">px</span>
                      </td>
                      <td className="py-5 text-right font-sans text-sm tabular-nums text-gold">
                        {price === null ? (
                          <span className="text-mist">
                            {s("ads.zones.onRequest")}
                          </span>
                        ) : (
                          <>
                            {formatMoney(price, locale, "MDL")}
                            <span className="ml-1 block text-xs text-mist">
                              {s("ads.priceMonthly")}
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-6 font-sans text-xs leading-relaxed text-mist">
            {s("ads.index.zonesFooter")}
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* De ce Corbul.md                                               */}
      {/* ------------------------------------------------------------ */}
      <section
        aria-labelledby="de-ce"
        className="border-y border-line bg-coal/50"
      >
        <Container className="py-16 lg:py-24">
          <div className="max-w-3xl">
            <h2
              id="de-ce"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {s("ads.index.whyTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {s("ads.index.whyIntro")}
            </p>
          </div>

          <ol className="roman-list roman-list-hang mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
            {WHY.map((key) => (
              <li key={key}>
                <h3 className="headline text-xl text-ivory">
                  {s(`ads.index.why.${key}.title` as const)}
                </h3>
                <p className="mt-3 font-serif text-sm leading-relaxed text-fog">
                  {s(`ads.index.why.${key}.body` as const)}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-12">
            <Link
              href="/publicitate/media-kit"
              className="link-gold text-xs uppercase tracking-[0.16em]"
            >
              {s("ads.mediaKitLink")} →
            </Link>
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Contact comercial                                             */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="contact-comercial">
        <Container className="py-16 lg:py-20">
          <div className="double-frame px-6 py-12 text-center md:px-12">
            <h2
              id="contact-comercial"
              className="headline text-3xl text-ivory md:text-4xl"
            >
              {s("ads.index.contactTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-serif leading-relaxed text-fog">
              {s("ads.index.contactBody")}
            </p>
            <p className="mt-6 font-sans text-sm text-mist">
              {s("ads.contactEmailLabel")}:{" "}
              <a
                href={`mailto:${ADS_EMAIL}`}
                className="text-gold transition-colors hover:text-ivory"
              >
                {ADS_EMAIL}
              </a>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="gold" href="/contact?subiect=publicitate">
                {s("ads.quoteCta")}
              </Button>
              <Button variant="ghost" href="/publicitate/media-kit">
                {s("ads.mediaKitLink")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
