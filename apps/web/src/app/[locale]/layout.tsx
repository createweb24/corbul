import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { TickerItem } from "@/components/shell";
import { MainNav, Masthead, SiteFooter, Ticker, TopBar } from "@/components/shell";
import { ThemeScript, ToastProvider } from "@/components/ui";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/types";
import { getArticles, getCategories, getSettings, getWidgets } from "../_lib/data";
import { fontVariables, siteViewport } from "../_lib/fonts";
import { siteUrl } from "../_lib/site";
import "../globals.css";

/**
 * Root layout-ul site-ului public (SPEC §6, §10bis).
 *
 * Randează `<html lang>` și `<body>` — panoul de administrare are propriul
 * root layout paralel, în afara segmentului `[locale]`. Limba se fixează
 * cu `setRequestLocale` ÎNAINTE de orice citire de context, ca paginile să
 * poată fi prerandate static (ISR), nu servite dinamic la fiecare cerere.
 *
 * Datele comune (setări, widgeturi, categorii, titluri „ultima oră") se cer
 * o singură dată, aici, și coboară ca props în componentele shell-ului.
 */

export const viewport: Viewport = siteViewport;

/**
 * Limbile sunt o listă închisă: orice alt prim segment (ex. `/foo.txt`,
 * `/manifest.json` — căile cu extensie ocolesc middleware-ul i18n) primește
 * 404 direct de la router. Fără asta, `notFound()` din layout ar randa
 * `not-found.tsx` (care citește limba din antete) într-o randare statică
 * și ar cădea cu 500 „static to dynamic at runtime".
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Paginile publice se randează pe server la cerere, nu ca HTML prerandat.
 *
 * Motivul este concret: la invalidarea unei etichete de cache (o salvare din
 * admin sau expirarea `revalidate`), regenerarea unei pagini prerandate
 * reintra în next-intl prin `requestLocale`, care citește antetele, iar Next
 * o respingea cu „Page changed from static to dynamic at runtime, reason:
 * headers" (500), respectiv `NoFallbackError` (404 generic) pe `/ro` și
 * `/ru` — adică tot site-ul cădea după fiecare salvare din panou.
 *
 * Costul este mic: datele rămân în cache-ul de fetch (`_lib/data.ts`, cu
 * etichete și `revalidate`), deci randarea nu lovește API-ul la fiecare
 * cerere. În plus, portalul are oricum bară cu ceas, vreme și curs, deci
 * HTML-ul complet static nu aducea un câștig real.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  // next-intl: fixează limba și în scopul metadatelor, altfel `requestLocale`
  // citește antetele, iar la regenerarea ISR pagina cade „static to dynamic".
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return {
    // Bază moștenită de TOATE paginile, ca rutele care nu trec prin
    // `buildMetadata` (rutele-convenție de imagini) să rezolve adresele
    // OG/Twitter față de adresa reală, nu de `localhost:3000`.
    metadataBase: new URL(siteUrl()),
    title: {
      default: t("common.siteName"),
      template: "%s | Corbul.md",
    },
    description: t("home.description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const messages = await getMessages({ locale });

  const [settings, widgets, categories, breaking] = await Promise.all([
    getSettings(),
    getWidgets(),
    getCategories(locale),
    getArticles({ locale, breaking: true, perPage: 6 }),
  ]);

  const navCategories = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
  }));

  // banda rulantă: elementele redacționale din setări + titlurile „breaking",
  // acestea din urmă cu legătură directă spre material
  const tickerItems: TickerItem[] = [
    ...(settings?.ticker?.[locale] ?? [])
      .filter((text) => Boolean(text && text.trim()))
      .map((text) => ({ text })),
    ...breaking.items.map((article) => ({
      text: article.title,
      href: `/articol/${article.slug}`,
    })),
  ];

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeScript />
        {/* Limba și mesajele se dau explicit: fără ele, providerul le cere
            singur din contextul cererii, iar la regenerarea ISR acea citire
            ajunge la `headers()` și randarea cade „static to dynamic". */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <div className="flex min-h-screen flex-col bg-obsidian text-ivory">
              <a
                href="#continut"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-gold focus:bg-coal focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-gold"
              >
                {t("nav.skipToContent")}
              </a>

              <TopBar widgets={widgets} />
              <Masthead tagline={settings?.tagline?.[locale] ?? null} />
              <MainNav categories={navCategories} />
              <Ticker items={tickerItems} />

              {/* Fără graniță Suspense / loading.tsx la acest nivel: în Next 15
                  un `notFound()` aruncat sub o graniță de streaming iese cu
                  HTTP 200 (soft 404). Fără graniță, răspunsul este 404 real,
                  cu titlul localizat în <head>. */}
              <main id="continut" className="flex-1">
                {children}
              </main>

              <SiteFooter
                categories={navCategories}
                contact={settings?.contact ?? null}
                tagline={settings?.tagline?.[locale] ?? null}
              />
            </div>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
