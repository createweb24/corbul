import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container, RavenMark } from "@/components/ui";
import type { Locale, PartnerTier } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { getSettings } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl } from "../../_lib/site";
import { PartnerForm, PremiumPlans } from "./SubscribeForms";

export const revalidate = 3600;

const BENEFITS = ["b1", "b2", "b3", "b4", "b5"] as const;
const FAQ = [1, 2, 3, 4, 5] as const;
const WHY = ["i1", "i2", "i3", "i4"] as const;

const DEFAULT_TIERS: Record<PartnerTier, number> = {
  bronze: 9900,
  silver: 19900,
  gold: 39900,
};

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
    path: "/abonament",
    title: t("subscribe.metaTitle"),
    description: t("subscribe.subtitle"),
  });
}

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const settings = await getSettings();

  const pricing = settings?.pricing;
  const currency = pricing?.currency ?? "MDL";
  const monthly =
    typeof pricing?.premiumMonthly === "number" ? pricing.premiumMonthly : 149;
  const annual =
    typeof pricing?.premiumAnnual === "number" ? pricing.premiumAnnual : 1490;
  const tiers: Record<PartnerTier, number> = {
    bronze: pricing?.tiers?.bronze ?? DEFAULT_TIERS.bronze,
    silver: pricing?.tiers?.silver ?? DEFAULT_TIERS.silver,
    gold: pricing?.tiers?.gold ?? DEFAULT_TIERS.gold,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: t("subscribe.title"),
        description: t("subscribe.subtitle"),
        url: absoluteUrl(locale, "/abonament"),
        offers: [
          {
            "@type": "Offer",
            name: t("subscribe.plans.monthly.name"),
            price: monthly,
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(locale, "/abonament"),
          },
          {
            "@type": "Offer",
            name: t("subscribe.plans.annual.name"),
            price: annual,
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(locale, "/abonament"),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((index) => ({
          "@type": "Question",
          name: t(`subscribe.faq.q${index}`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`subscribe.faq.a${index}`),
          },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ------------------------------------------------------------ */}
      <section className="border-b border-line bg-coal/50">
        <Container className="py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <RavenMark size={34} />
              <p className="kicker">{t("subscribe.kicker")}</p>
            </div>
            <h1 className="headline headline-tight mt-6 text-5xl text-ivory md:text-7xl">
              {t("subscribe.title")}
            </h1>
            <div className="rule-gold mt-8 w-40" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-fog md:text-2xl">
              {t("subscribe.subtitle")}
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Planuri + ce include                                          */}
      {/* ------------------------------------------------------------ */}
      <Container className="py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
          <section aria-labelledby="planuri">
            <h2 id="planuri" className="kicker kicker-muted">
              {t("subscribe.plans.title")}
            </h2>
            <div className="mt-6">
              <PremiumPlans monthly={monthly} annual={annual} currency={currency} />
            </div>
          </section>

          <section
            aria-labelledby="include"
            className="border-l border-line pl-8 lg:pl-12"
          >
            <h2 id="include" className="headline text-2xl text-ivory">
              {t("subscribe.benefits.title")}
            </h2>
            <ol className="roman-list roman-list-hang mt-7 space-y-5">
              {BENEFITS.map((key) => (
                <li key={key} className="font-serif leading-relaxed text-fog">
                  {t(`subscribe.benefits.${key}`)}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Întrebări frecvente                                           */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="faq" className="border-y border-line bg-coal-2/60">
        <Container className="py-16 lg:py-20">
          <h2 id="faq" className="headline text-4xl text-ivory">
            {t("subscribe.faq.title")}
          </h2>

          <dl className="mt-10 grid gap-px bg-line md:grid-cols-2">
            {FAQ.map((index) => (
              <div key={index} className="bg-coal px-6 py-8 md:px-9">
                <dt className="headline text-xl text-ivory">
                  {t(`subscribe.faq.q${index}`)}
                </dt>
                <dd className="mt-4 font-serif leading-relaxed text-fog">
                  {t(`subscribe.faq.a${index}`)}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Parteneriate B2B                                              */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="parteneriate">
        <Container className="py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="kicker">{t("subscribe.partners.kicker")}</p>
              <h2
                id="parteneriate"
                className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl"
              >
                {t("subscribe.partners.title")}
              </h2>
              <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-fog">
                {t("subscribe.partners.subtitle")}
              </p>
            </div>

            <aside className="border-l-2 border-gold pl-7">
              <h3 className="kicker">{t("subscribe.partners.why.title")}</h3>
              <ul className="mt-5 space-y-3">
                {WHY.map((key) => (
                  <li key={key} className="flex gap-3 font-serif text-sm leading-relaxed text-fog">
                    <span aria-hidden="true" className="mt-0.5 text-gold">
                      ◆
                    </span>
                    <span>{t(`subscribe.partners.why.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <div className="mt-14">
            <PartnerForm tiers={tiers} currency={currency} />
          </div>
        </Container>
      </section>
    </>
  );
}
