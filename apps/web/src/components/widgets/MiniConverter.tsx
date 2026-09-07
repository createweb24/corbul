"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { RateDto } from "@/lib/types";

/**
 * Convertor bidirecțional, live: orice valută ⇄ orice valută, prin MDL,
 * la cursul oficial BNM primit ca props. Ambele câmpuri sunt editabile;
 * cel neatins se recalculează la fiecare tastă. Valorile se afișează cu
 * separatorul zecimal al limbii (virgulă în RO și RU) și se citesc
 * tolerant, cu punct sau virgulă.
 */

export interface MiniConverterProps {
  rates: RateDto[];
}

const MDL = "MDL";

function parseAmount(raw: string): number {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Fără grupare de mii: textul stă într-un câmp editabil și se reparsează. */
function display(value: number, locale: string): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  return formatNumber(rounded, locale, {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

export function MiniConverter({ rates }: MiniConverterProps) {
  const t = useTranslations("widgets.rates.converter");
  const locale = useLocale();
  const fieldId = useId();

  const codes = useMemo(() => [MDL, ...rates.map((r) => r.code)], [rates]);

  /** MDL pentru o unitate din valuta dată. */
  const rateOf = useCallback(
    (code: string): number => {
      if (code === MDL) return 1;
      const found = rates.find((r) => r.code === code);
      return found && found.rate > 0 ? found.rate : 1;
    },
    [rates],
  );

  const [from, setFrom] = useState<string>(
    rates.some((r) => r.code === "EUR") ? "EUR" : (rates[0]?.code ?? MDL),
  );
  const [to, setTo] = useState<string>(MDL);
  const [left, setLeft] = useState<string>("1");
  const [right, setRight] = useState<string>(() =>
    display(
      rateOf(rates.some((r) => r.code === "EUR") ? "EUR" : (rates[0]?.code ?? MDL)),
      locale,
    ),
  );

  const convert = useCallback(
    (value: number, source: string, target: string): number =>
      (value * rateOf(source)) / rateOf(target),
    [rateOf],
  );

  const onLeft = (raw: string) => {
    setLeft(raw);
    setRight(display(convert(parseAmount(raw), from, to), locale));
  };

  const onRight = (raw: string) => {
    setRight(raw);
    setLeft(display(convert(parseAmount(raw), to, from), locale));
  };

  const onFrom = (code: string) => {
    setFrom(code);
    setRight(display(convert(parseAmount(left), code, to), locale));
  };

  const onTo = (code: string) => {
    setTo(code);
    setRight(display(convert(parseAmount(left), from, code), locale));
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setLeft(right);
    setRight(left);
  };

  const inputClass =
    "w-full min-w-0 border border-line bg-obsidian px-2.5 py-2 text-[14px] tabular-nums text-ivory outline-none transition-colors duration-200 focus:border-gold focus:ring-1 focus:ring-gold/40 rounded-[var(--radius)]";
  const selectClass =
    "w-full min-w-0 cursor-pointer appearance-none border border-line bg-coal-2 px-2.5 py-2 text-[12px] font-medium tracking-[0.06em] text-fog outline-none transition-colors duration-200 hover:text-ivory focus:border-gold focus:ring-1 focus:ring-gold/40 rounded-[var(--radius)]";

  return (
    <div className="border-t border-line px-4 py-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-gold">
        {t("title")}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <label
            htmlFor={`${fieldId}-left`}
            className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-mist"
          >
            {t("from")}
          </label>
          <input
            id={`${fieldId}-left`}
            inputMode="decimal"
            autoComplete="off"
            value={left}
            onChange={(event) => onLeft(event.target.value)}
            className={inputClass}
          />
          <select
            aria-label={t("from")}
            value={from}
            onChange={(event) => onFrom(event.target.value)}
            className={`${selectClass} mt-1`}
          >
            {codes.map((code) => (
              <option key={code} value={code} className="bg-coal">
                {code}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label={t("swap")}
          title={t("swap")}
          className="mb-[38px] flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-line text-mist transition-colors duration-200 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2" />
          </svg>
        </button>

        <div>
          <label
            htmlFor={`${fieldId}-right`}
            className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-mist"
          >
            {t("to")}
          </label>
          <input
            id={`${fieldId}-right`}
            inputMode="decimal"
            autoComplete="off"
            value={right}
            onChange={(event) => onRight(event.target.value)}
            className={inputClass}
          />
          <select
            aria-label={t("to")}
            value={to}
            onChange={(event) => onTo(event.target.value)}
            className={`${selectClass} mt-1`}
          >
            {codes.map((code) => (
              <option key={code} value={code} className="bg-coal">
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-mist">{t("note")}</p>
    </div>
  );
}

export default MiniConverter;
