import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/types";
import LegalDocument from "../../_lib/LegalDocument";
import { getSettings } from "../../_lib/data";
import { buildMetadata } from "../../_lib/seo";

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
    path: "/termeni",
    title: t("legal.terms.title"),
    description: t("legal.terms.description"),
  });
}

/** Termenii de utilizare (contract C6). */
export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const settings = await getSettings();
  return <LegalDocument kind="terms" locale={locale} settings={settings} />;
}
