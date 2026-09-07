import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar, Button, Container, RavenMark } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { truncate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import JsonLd from "../../_lib/JsonLd";
import { getAuthors, getSettings } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";
import { absoluteUrl, organizationNode } from "../../_lib/site";

export const revalidate = 3600;

/** Cheile celor cinci principii, în ordinea din SPEC §7. */
const PRINCIPLES = [
  "independence",
  "verification",
  "corrections",
  "separation",
  "transparency",
] as const;

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
    path: "/despre",
    title: t("about.title"),
    description: truncate(t("about.mission.body"), 155),
    // „Despre Corbul.md" conține deja brandul — fără sufixul „| Corbul.md"
    absoluteTitle: true,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [authors, settings] = await Promise.all([getAuthors(locale), getSettings()]);
  const contact = settings?.contact ?? null;
  const address = contact
    ? locale === "ru"
      ? contact.address_ru
      : contact.address_ro
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t("about.title"),
    url: absoluteUrl(locale, "/despre"),
    description: t("about.subtitle"),
    mainEntity: {
      ...organizationNode(locale, settings),
      email: contact?.email,
      telephone: contact?.phone,
      address: address ?? undefined,
      employee: authors.map((author) => ({
        "@type": "Person",
        name: author.name,
        jobTitle: author.role,
        url: absoluteUrl(locale, `/autor/${author.slug}`),
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ------------------------------------------------------------ */}
      <section className="border-b border-line bg-coal/50">
        <Container className="py-16 lg:py-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4">
              <RavenMark size={32} />
              <p className="kicker">{t("about.kicker")}</p>
            </div>
            <h1 className="headline headline-tight mt-6 text-5xl text-ivory md:text-7xl">
              {t("about.title")}
            </h1>
            <div className="rule-gold mt-8 w-40" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-fog md:text-2xl">
              {t("about.subtitle")}
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="headline text-3xl text-ivory md:text-4xl">
              {t("about.mission.title")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {t("about.mission.body")}
            </p>
          </div>

          <aside className="border-l border-line pl-8 lg:pl-10">
            <p className="kicker kicker-muted">{t("contact.details.title")}</p>
            <ul className="mt-5 space-y-3 font-sans text-sm text-fog">
              {contact?.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors hover:text-gold"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact?.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="transition-colors hover:text-gold"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {address ? <li className="text-mist">{address}</li> : null}
            </ul>
            <div className="mt-7">
              <Button variant="ghost" href="/contact">
                {t("contact.kicker")}
              </Button>
            </div>
          </aside>
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {/* Principii editoriale — numerotate roman                       */}
      {/* ------------------------------------------------------------ */}
      <section aria-labelledby="principii" className="border-y border-line bg-coal-2/60">
        <Container className="py-16 lg:py-24">
          <div className="max-w-3xl">
            <h2
              id="principii"
              className="headline headline-tight text-4xl text-ivory md:text-5xl"
            >
              {t("about.principles.title")}
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-fog">
              {t("about.principles.intro")}
            </p>
          </div>

          <ol className="roman-list roman-list-hang mt-12 grid gap-px bg-line md:grid-cols-2">
            {PRINCIPLES.map((key) => (
              <li key={key} className="bg-coal px-6 py-10 md:px-9">
                <h3 className="headline text-2xl text-ivory">
                  {t(`about.principles.${key}.title`)}
                </h3>
                <p className="mt-4 font-serif leading-relaxed text-fog">
                  {t(`about.principles.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ------------------------------------------------------------ */}
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <section className="border-l-2 border-gold pl-7">
            <h2 className="headline text-3xl text-ivory">
              {t("about.corrections.title")}
            </h2>
            <p className="mt-5 font-serif leading-relaxed text-fog">
              {t("about.corrections.body")}
            </p>
            <p className="mt-6">
              <Link href="/contact" className="link-gold text-xs uppercase tracking-[0.16em]">
                {t("about.corrections.cta")} →
              </Link>
            </p>
          </section>

          <section className="border-l-2 border-line pl-7">
            <h2 className="headline text-3xl text-ivory">
              {t("about.funding.title")}
            </h2>
            <p className="mt-5 font-serif leading-relaxed text-fog">
              {t("about.funding.body")}
            </p>
            <p className="mt-6">
              <Link
                href="/abonament"
                className="link-gold text-xs uppercase tracking-[0.16em]"
              >
                {t("subscribe.title")} →
              </Link>
            </p>
          </section>
        </div>
      </Container>

      {/* ------------------------------------------------------------ */}
      {authors.length > 0 ? (
        <section className="border-t border-line">
          <Container className="py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="headline text-4xl text-ivory">
                {t("about.team.title")}
              </h2>
              <Link href="/echipa" className="link-gold text-xs uppercase tracking-[0.16em]">
                {t("about.team.cta")} →
              </Link>
            </div>

            <p className="mt-6 max-w-3xl font-serif leading-relaxed text-fog">
              {t("about.team.body")}
            </p>

            <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
              {authors.map((author) => (
                <li key={author.slug}>
                  <Link
                    href={`/autor/${author.slug}`}
                    className="group flex items-center gap-3"
                  >
                    <Avatar
                      initials={author.initials}
                      name={author.name}
                      size={44}
                    />
                    <span className="font-sans text-sm">
                      <span className="block font-semibold text-ivory transition-colors group-hover:text-gold">
                        {author.name}
                      </span>
                      <span className="block text-xs text-mist">{author.role}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ */}
      <section className="border-t border-line bg-coal/50">
        <Container className="py-16 lg:py-20">
          <div className="double-frame px-6 py-12 text-center md:px-12">
            <h2 className="headline text-3xl text-ivory md:text-4xl">
              {t("about.contactCta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-serif leading-relaxed text-fog">
              {t("about.contactCta.body")}
            </p>
            <div className="mt-8 flex justify-center">
              <Button variant="gold" href="/contact">
                {t("about.contactCta.cta")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
