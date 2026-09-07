import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatNumber } from "@/lib/format";
import type { RateDto } from "@/lib/types";
import { MiniConverter } from "./MiniConverter";

/**
 * Cursul oficial BNM: valoare, variație față de referința anterioară
 * (săgeată verde/roșie) și convertorul rapid bidirecțional.
 * Cifrele se formatează după locale (virgulă zecimală în RO și RU).
 */

export interface RatesWidgetProps {
  rates: RateDto[];
  /** momentul preluării — folosit ca dată doar dacă `ratesDate` lipsește */
  fetchedAt?: string | null;
  /** data efectivă a cursului BNM (ISO `YYYY-MM-DD`), din `/api/widgets` */
  ratesDate?: string | null;
  stale?: boolean;
  /** ascunde convertorul (util în pagini care au deja unul mare) */
  showConverter?: boolean;
}

const RATE_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
};

function TrendMark({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.00005) {
    return (
      <span aria-hidden="true" className="text-mist">
        —
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      aria-hidden="true"
      className={up ? "text-sage" : "text-ember"}
      style={{ lineHeight: 1 }}
    >
      {up ? "▲" : "▼"}
    </span>
  );
}

export function RatesWidget({
  rates,
  fetchedAt,
  ratesDate,
  stale = false,
  showConverter = true,
}: RatesWidgetProps) {
  const t = useTranslations("widgets");
  const locale = useLocale();

  if (!rates.length) return null;

  const dateLabel = ratesDate ?? fetchedAt ?? null;

  return (
    <section
      className="border border-line bg-coal"
      aria-labelledby="widget-rates-title"
    >
      <div className="h-px bg-gradient-to-r from-gold/60 via-gold/10 to-transparent" />

      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <h2
          id="widget-rates-title"
          className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-ivory"
        >
          {t("rates.title")}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-mist">
          {stale
            ? t("stale")
            : dateLabel
              ? formatDate(dateLabel, locale, { year: undefined })
              : null}
        </span>
      </header>

      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">{t("rates.note")}</caption>
        <thead>
          <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-mist">
            <th scope="col" className="px-4 py-2 text-left font-medium">
              {t("rates.code")}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t("rates.rate")}
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              {t("rates.change")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            const delta = rate.rate - rate.prev;
            const trendLabel =
              Math.abs(delta) < 0.00005
                ? t("rates.flat")
                : delta > 0
                  ? t("rates.up")
                  : t("rates.down");
            return (
              <tr
                key={rate.code}
                className="border-b border-line/60 transition-colors duration-200 last:border-b-0 hover:bg-coal-2"
              >
                <th scope="row" className="px-4 py-2 text-left font-normal">
                  <span className="font-semibold tracking-[0.06em] text-ivory">
                    {rate.code}
                  </span>
                  <span className="ml-2 hidden text-[11px] text-mist sm:inline">
                    {locale === "ru" ? rate.nameRu : rate.nameRo}
                  </span>
                </th>
                <td className="px-2 py-2 text-right tabular-nums text-ivory">
                  {formatNumber(rate.rate, locale, RATE_FORMAT)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <span className="inline-flex items-center gap-1 text-[12px]">
                    <TrendMark delta={delta} />
                    <span
                      className={
                        Math.abs(delta) < 0.00005
                          ? "text-mist"
                          : delta > 0
                            ? "text-sage"
                            : "text-ember"
                      }
                    >
                      {formatNumber(delta, locale, {
                        ...RATE_FORMAT,
                        signDisplay: "exceptZero",
                      })}
                    </span>
                    <span className="sr-only">{trendLabel}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showConverter ? <MiniConverter rates={rates} /> : null}

      <p className="border-t border-line px-4 py-2 text-[11px] text-mist">
        {stale ? t("staleNote") : t("rates.source")}
      </p>
    </section>
  );
}

export default RatesWidget;
