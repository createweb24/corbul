import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads";
import { Button, Container, RavenMark } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { truncate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import JsonLd from "../../../_lib/JsonLd";
import { getSettings } from "../../../_lib/data";
import { buildMetadata } from "../../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../../_lib/site";
import { ADS_EMAIL, adsText } from "../_data/copy";
import {
  AD_SERVICE_SLUGS,
  formatServicePrice,
  getAdService,
  localizeAdService,
  localizedAdServices,
} from "../_data/services";

/**
 * `/publicitate/[serviciu]` — pagina unui serviciu comercial (ADS-SPEC §7).
 *
 * Slug-urile sunt o listă închisă, în română, aceeași în ambele limbi:
 * orice altceva primește 404, ca adresele comerciale să nu genereze pagini
 * fantomă indexabile.
 */

export const revalidate = 3600;

interface RouteParams {
  locale: string;
  serviciu: string;
}

export function generateStaticParams(): { serviciu: string }[] {
  return AD_SERVICE_SLUGS.map((serviciu) => ({ serviciu }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale: raw, serviciu } = await params;
  const locale = raw as Locale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);

  const definition = getAdService(serviciu);
  if (!definition) return {};

  const t = await getTranslations({ locale });
  const s = adsText(locale, t);
  const service = localizeAdService(definition, locale);

  return buildMetadata({
    locale,
    path: `/publicitate/${service.slug}`,
    title: `${service.name} — ${s("ads.kicker")}`,
    description: truncate(service.lead, 155),
  });
}

export default async function AdServicePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale: raw, serviciu } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const definition = getAdService(serviciu);
  if (!definition) notFound();

  const t = await getTranslations({ locale });
  const s = adsText(locale, t);
  const settings = await getSettings();

  const service = localizeAdService(definition, locale);
  const others = localizedAdServices(locale).filter(
    (item) => item.slug !== service.slug,
  );

  const organization = organizationNode(locale, settings);
  const url = absoluteUrl(locale, `/publicitate/${service.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.name,
        description: service.lead,
        url,
        serviceType: service.name,
        areaServed: "MD",
        provider: organization,
        offers: {
          "@type": "Offer",
          price: service.priceFromEur,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url,
          // tariful lunar se declară ca atare, ca prețul să nu fie citit
          // drept plată unică (UN/CEFACT: `MON` = lună)
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
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: s("ads.index.title"),
            item: absoluteUrl(locale, "/publicitate"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: service.name,
            item: url,
          },
        ],
      },
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
              <RavenMark size={30} />
              <p className="kicker">{s("ads.kicker")}</p>
            </div>
            <h1 className="headline headline-tight mt-6 text-4xl text-ivory md:text-6xl">
              {service.name}
            </h1>
            <div className="rule-gold mt-8 w-32" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-fog md:text-2xl">
              {service.lead}
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Corpul explicativ + caseta de preț                            */}
      {/* ------------------------------------------------------------ */}
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            {service.body.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? "font-serif text-lg leading-relaxed text-fog"
                    : "mt-6 font-serif text-lg leading-relaxed text-fog"
                }
              >
                {paragraph}
              </p>
            ))}

            <h2 className="headline mt-14 text-3xl text-ivory">
              {s("ads.includesTitle")}
            </h2>
            <ul className="mt-7 space-y-4">
              {service.includes.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 font-serif leading-relaxed text-fog"
                >
                  <span aria-hidden="true" className="mt-1 shrink-0 text-gold">
                    ◆
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="headline mt-14 text-3xl text-ivory">
              {s("ads.forWhomTitle")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {service.forWhom}
            </p>
          </div>

          {/* preț + termen + îndemn — coloana din dreapta */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-line bg-coal px-7 py-9">
              <p className="kicker kicker-muted">{s("ads.priceTitle")}</p>
              <p className="mt-4 font-sans text-xs uppercase tracking-[0.16em] text-mist">
                {s("ads.priceFrom")}
              </p>
              <p className="headline mt-1 text-4xl text-gold">
                {formatServicePrice(service, locale, s("ads.priceUnitMonth"))}
              </p>
              <p className="mt-4 font-sans text-xs leading-relaxed text-mist">
                {s("ads.priceNoteEur")}
              </p>
              <p className="mt-2 font-sans text-xs leading-relaxed text-mist">
                {s("ads.billingNote")}
              </p>

              <div className="mt-8 border-t border-line pt-7">
                <p className="kicker kicker-muted">
                  {s("ads.turnaroundTitle")}
                </p>
                <p className="mt-3 font-serif text-sm leading-relaxed text-fog">
                  {service.turnaround}
                </p>
              </div>

              <div className="mt-8">
                <Button
                  variant="gold"
                  fullWidth
                  href={`/contact?subiect=${service.slug}`}
                >
                  {s("ads.quoteCta")}
                </Button>
              </div>

              <p className="mt-5 text-center font-sans text-xs text-mist">
                <a
                  href={`mailto:${ADS_EMAIL}?subject=${encodeURIComponent(service.name)}`}
                  className="transition-colors hover:text-gold"
                >
                  {ADS_EMAIL}
                </a>
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Transparență editorială                                       */}
      {/* ------------------------------------------------------------ */}
      <section
        aria-labelledby="transparenta"
        className="border-y border-line bg-coal-2/60"
      >
        <Container className="py-14 lg:py-16">
          <div className="border-l-2 border-gold pl-7 lg:pl-10">
            <h2 id="transparenta" className="kicker">
              {s("ads.disclosureTitle")}
            </h2>
            <p className="mt-5 max-w-4xl font-serif text-lg leading-relaxed text-fog">
              {service.disclosure}
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Celelalte servicii                                            */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="alte-servicii">
        <Container className="py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2
              id="alte-servicii"
              className="headline text-3xl text-ivory md:text-4xl"
            >
              {s("ads.otherServicesTitle")}
            </h2>
            <Link
              href="/publicitate"
              className="link-gold text-xs uppercase tracking-[0.16em]"
            >
              {s("ads.backToIndex")} →
            </Link>
          </div>

          <ul className="mt-10 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
            {others.map((item) => (
              <li key={item.slug} className="group bg-coal">
                <Link
                  href={`/publicitate/${item.slug}`}
                  className="flex h-full flex-col px-6 py-8 transition-colors duration-200 ease-editorial hover:bg-coal-2 md:px-8"
                >
                  <h3 className="headline text-xl text-ivory transition-colors duration-200 group-hover:text-gold">
                    {item.name}
                  </h3>
                  <p className="mt-3 flex-1 font-serif text-sm leading-relaxed text-fog">
                    {truncate(item.lead, 120)}
                  </p>
                  <span className="mt-5 font-sans text-xs uppercase tracking-[0.16em] text-mist">
                    {s("ads.priceFrom")}{" "}
                    <span className="tracking-normal text-gold">
                      {formatServicePrice(item, locale, s("ads.priceUnitMonth"))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* spațiul publicitar din corpul paginii (ADS-SPEC §3) */}
          <div className="mt-14 flex justify-center">
            <AdSlot zoneKey="article_inline" />
          </div>
        </Container>
      </section>
    </>
  );
}
