import { hasLocale } from "next-intl";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/types";
import { getArticles, getSettings } from "../../_lib/data";
import { buildRssFeed } from "../../_lib/rss";

/**
 * `GET /ro/rss.xml` · `GET /ru/rss.xml` — fluxul RSS 2.0 al ultimelor
 * 30 de articole, în limba cerută. Cache ISR de 15 minute, ca widgeturile.
 */

export const revalidate = 900;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const locale = raw as Locale;

  const [articles, settings] = await Promise.all([
    getArticles({ locale, perPage: 30 }),
    getSettings(),
  ]);

  return new NextResponse(buildRssFeed(locale, articles.items, settings), {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
}
