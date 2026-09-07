import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { getSettings } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../_lib/site";
import { ContactForm, TipForm } from "./ContactForms";

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
    path: "/contact",
    title: t("contact.metaTitle"),
    description: t("contact.metaDescription"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const settings = await getSettings();
  const contact = settings?.contact ?? null;
  const address = contact
    ? locale === "ru"
      ? contact.address_ru
      : contact.address_ro
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: t("contact.title"),
    description: t("contact.subtitle"),
    url: absoluteUrl(locale, "/contact"),
    about: {
      ...organizationNode(locale, settings),
      email: contact?.email,
      telephone: contact?.phone,
      address: address ?? undefined,
    },
  };

  const details: { label: string; value: string; href?: string }[] = [];
  if (contact?.email) {
    details.push({
      label: t("contact.details.email"),
      value: contact.email,
      href: `mailto:${contact.email}`,
    });
  }
  if (contact?.phone) {
    details.push({
      label: t("contact.details.phone"),
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s+/g, "")}`,
    });
  }
  if (address) {
    details.push({ label: t("contact.details.address"), value: address });
  }
  details.push({
    label: t("contact.details.hours"),
    value: t("contact.details.hoursValue"),
  });

  // informarea cerută de Legea 133/2011, sub fiecare formular care primește date
  const consent = (
    <p className="mt-5 font-sans text-xs leading-relaxed text-mist">
      {t.rich("common.privacyConsent", {
        link: (chunks) => (
          <Link href="/confidentialitate" className="link-gold">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );

  return (
    <>
      <JsonLd data={jsonLd} />

      <Container className="py-14 lg:py-20">
        <header className="max-w-3xl border-b border-line pb-10">
          <p className="kicker">{t("contact.kicker")}</p>
          <h1 className="headline headline-tight mt-4 text-5xl text-ivory md:text-6xl">
            {t("contact.title")}
          </h1>
          <div className="rule-gold mt-7 w-32" />
          <p className="mt-7 font-serif text-lg leading-relaxed text-fog">
            {t("contact.subtitle")}
          </p>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* ---------------------------------------------------------- */}
          {/* Datele redacției + canalul securizat                       */}
          {/* ---------------------------------------------------------- */}
          <section aria-labelledby="date-contact">
            <h2 id="date-contact" className="kicker kicker-muted">
              {t("contact.details.title")}
            </h2>

            <dl className="mt-6 divide-y divide-line border-y border-line">
              {details.map((item) => (
                <div key={item.label} className="flex gap-6 py-4">
                  <dt className="meta w-28 shrink-0 uppercase tracking-[0.16em]">
                    {item.label}
                  </dt>
                  <dd className="min-w-0 font-serif text-fog">
                    {item.href ? (
                      <a href={item.href} className="transition-colors hover:text-gold">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 border border-line bg-coal/50 px-6 py-6">
              <h2 className="headline text-xl text-ivory">
                {t("contact.press.title")}
              </h2>
              <p className="mt-3 font-serif text-sm leading-relaxed text-fog">
                {t("contact.press.text")}
              </p>
            </div>

            {/* Pont securizat — chenar auriu dublu, canal distinct;
                `id="pont"` este ținta legăturii din subsol, `scroll-mt`
                compensează navigația lipicioasă */}
            <div id="pont" className="double-frame mt-10 scroll-mt-24 px-6 py-8 md:px-8">
              <p className="kicker">{t("contact.tip.kicker")}</p>
              <h2 className="headline mt-4 text-3xl text-ivory">
                {t("contact.tip.title")}
              </h2>
              <p className="mt-5 font-serif leading-relaxed text-fog">
                {t("contact.tip.text")}
              </p>

              <div className="mt-8">
                <TipForm />
              </div>
              {consent}

              <p className="mt-8 border-t border-line pt-5 font-sans text-xs leading-relaxed text-mist">
                {t("contact.tip.note")}
              </p>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* Formularul obișnuit                                        */}
          {/* ---------------------------------------------------------- */}
          <section aria-labelledby="formular" className="bg-coal/60 p-7 md:p-10">
            <h2 id="formular" className="headline text-3xl text-ivory">
              {t("contact.form.title")}
            </h2>
            <div className="mt-8">
              <ContactForm />
            </div>
            {consent}
          </section>
        </div>
      </Container>
    </>
  );
}
