import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import type { Locale } from "@/lib/types";
import { buildMetadata } from "../../../_lib/seo";
import SuccessPanel from "./SuccessPanel";

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
    path: "/abonament/succes",
    title: t("subscribe.success.title"),
    description: t("subscribe.success.text"),
    noIndex: true,
  });
}

export default async function SubscribeSuccessPage({
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
  const value = query.session_id;
  const sessionId = typeof value === "string" && value.trim() ? value : null;

  return (
    <Container size="narrow" className="py-20 lg:py-28">
      <SuccessPanel sessionId={sessionId} />
    </Container>
  );
}
