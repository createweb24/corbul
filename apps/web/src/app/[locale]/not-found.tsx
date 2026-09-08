import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Button, Container } from "@/components/ui";

/**
 * 404 pe identitatea vizuală: corb, cifră mare Playfair, linie aurie.
 * Se randează în interiorul shell-ului public (layout-ul din `[locale]`),
 * atât pentru `notFound()` din pagini, cât și pentru căile fără rută
 * (prin `[...rest]/page.tsx`).
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale });
  return {
    title: t("errors.notFound.title"),
    description: t("errors.notFound.text"),
    robots: { index: false, follow: false },
  };
}

export default async function LocaleNotFound() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <Container size="narrow" className="py-24 lg:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center opacity-70">
        </div>

        <p className="kicker mt-10">{t("errors.notFound.kicker")}</p>

        <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl">
          {t("errors.notFound.title")}
        </h1>

        <div className="rule-gold-center mx-auto mt-7 w-20" />

        <p className="mx-auto mt-7 max-w-lg font-serif text-lg leading-relaxed text-fog">
          {t("errors.notFound.text")}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button variant="gold" href="/">
            {t("errors.notFound.cta")}
          </Button>
          <Button variant="ghost" href="/cautare">
            {t("errors.notFound.search")}
          </Button>
        </div>
      </div>
    </Container>
  );
}
