"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import type { WidgetsDto } from "@/lib/types";
import {
  WeatherIcon,
  weatherLabelKey,
} from "@/components/widgets/WeatherWidget";

/**
 * Bara de serviciu: data completă + ceas viu la stânga, vremea și
 * cursul compact la mijloc, serviciile la dreapta.
 *
 * Ceasul pornește gol și se umple abia după montare: serverul randează
 * pagina la build (SSG), deci orice oră tipărită pe server ar produce un
 * dezacord de hidratare. Intervalul de 1s se curăță la demontare.
 */

export interface TopBarProps {
  widgets?: WidgetsDto | null;
}

const CLOCK_PLACEHOLDER = "--:--:--";

export function TopBar({ widgets }: TopBarProps) {
  const t = useTranslations("nav");
  const tw = useTranslations("widgets");
  const locale = useLocale();

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = now
    ? formatDate(now, locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const timeLabel = now
    ? formatTime(now, locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : CLOCK_PLACEHOLDER;

  const weather = widgets?.weather ?? null;
  const rates = widgets?.rates ?? [];
  const eur = rates.find((rate) => rate.code === "EUR") ?? null;
  const usd = rates.find((rate) => rate.code === "USD") ?? null;

  const serviceLink =
    "text-fog transition-colors duration-200 hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold";

  const compactRate = (value: number) =>
    formatNumber(value, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section
      className="border-b border-line bg-obsidian text-[13px]"
      aria-label={t("topLabel")}
    >
      <Container className="flex items-center gap-4 py-2.5">
        {/* data + ceas */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden truncate text-fog first-letter:uppercase sm:inline">
            {dateLabel || " "}
          </span>
          <span aria-hidden="true" className="hidden text-line-2 sm:inline">
            ·
          </span>
          <span
            className="font-medium tabular-nums text-gold"
            suppressHydrationWarning
          >
            {timeLabel}
          </span>
        </div>

        {/* vreme + curs compact */}
        <div className="hidden items-center gap-4 text-fog md:flex">
          {weather ? (
            <span className="flex items-center gap-1.5">
              <WeatherIcon
                code={weather.code}
                size={16}
                className="text-fog"
                label={tw(`weather.codes.${weatherLabelKey(weather.code)}`)}
              />
              <span className="tabular-nums text-fog">
                {Math.round(weather.tempC)}°C
              </span>
              <span className="hidden lg:inline">{tw("weather.city")}</span>
            </span>
          ) : null}

          {eur || usd ? (
            <span className="flex items-center gap-3 tabular-nums">
              {eur ? (
                <span>
                  <span className="text-fog">EUR </span>
                  <span className="text-fog">{compactRate(eur.rate)}</span>
                </span>
              ) : null}
              {usd ? (
                <span>
                  <span className="text-fog">USD </span>
                  <span className="text-fog">{compactRate(usd.rate)}</span>
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        {/* servicii */}
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <Link href="/instrumente" className={`hidden sm:inline ${serviceLink}`}>
            {t("tools")}
          </Link>
          <Link href="/contact" className={`hidden sm:inline ${serviceLink}`}>
            {t("contact")}
          </Link>
          <ThemeToggle
            labelToLight={t("theme.toLight")}
            labelToDark={t("theme.toDark")}
          />
          {/* Adminul este un root layout paralel: navigarea trebuie să fie o
              încărcare completă, nu una prin router. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin"
            className={`hidden lg:inline ${serviceLink}`}
            rel="nofollow"
          >
            {t("admin")}
          </a>
        </div>
      </Container>
    </section>
  );
}

export default TopBar;
