"use client";

/**
 * 4. Convertor valutar BNM (SPEC §8.4)
 * Orice valută → orice valută, prin leul moldovenesc, la cursul oficial
 * servit de `/api/widgets`. Dacă API-ul nu răspunde, pagina primește
 * valorile de rezervă și o marchează vizibil.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, RateDto } from "@/lib/types";
import {
  convertAmount,
  currencyOptions,
  dec,
  numPositive,
  type CurrencyOption,
} from "./calc-lib";
import {
  CalcGrid,
  CalcHeader,
  Disclaimer,
  Headline,
  NumberField,
  Row,
  RowGroupTitle,
  SelectField,
} from "./calc-ui";

export interface ConverterCalculatorProps {
  locale: Locale;
  rates: readonly RateDto[];
  ratesDate: string | null;
  stale: boolean;
}

export default function ConverterCalculator({
  locale,
  rates,
  ratesDate,
  stale,
}: ConverterCalculatorProps) {
  const t = useTranslations("tools.converter");
  const g = useTranslations("tools");

  const options = useMemo<CurrencyOption[]>(
    () => currencyOptions(rates, locale, t("mdlName")),
    [rates, locale, t],
  );

  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("MDL");

  const fromOption = options.find((option) => option.code === from);
  const toOption = options.find((option) => option.code === to);
  const value = numPositive(amount);
  const converted = convertAmount(value, fromOption, toOption);

  const selectOptions = options.map((option) => ({
    value: option.code,
    label: `${option.code} · ${option.name}`,
  }));

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const cross =
    fromOption && toOption && toOption.rate > 0
      ? fromOption.rate / toOption.rate
      : Number.NaN;

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <NumberField
              label={g("common.amount")}
              value={amount}
              onChange={setAmount}
              unit={fromOption?.code}
            />

            <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <SelectField
                label={g("common.from")}
                value={from}
                onChange={setFrom}
                options={selectOptions}
              />
              <button
                type="button"
                onClick={swap}
                aria-label={g("common.swap")}
                title={g("common.swap")}
                className="press mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-[var(--radius)] border border-line bg-coal text-gold transition-colors duration-200 hover:border-gold hover:bg-coal-2 sm:mx-auto"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 fill-none stroke-current stroke-[1.5]"
                >
                  <path
                    d="M4 7h12M13 4l3 3-3 3M16 13H4M7 10l-3 3 3 3"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <SelectField
                label={g("common.to")}
                value={to}
                onChange={setTo}
                options={selectOptions}
              />
            </div>

            <p className="font-sans text-[0.75rem] leading-relaxed text-mist">
              {t("viaMdl")}
            </p>
          </>
        }
        results={
          <>
            <Headline
              label={t("result")}
              value={
                Number.isFinite(converted)
                  ? `${dec(converted, locale, 2)} ${toOption?.code ?? ""}`
                  : "—"
              }
              sub={
                ratesDate
                  ? stale
                    ? t("rateStale")
                    : t("rateDate", { date: ratesDate })
                  : t("rateStale")
              }
            />

            <div className="mt-6">
              <RowGroupTitle>{t("groupRates")}</RowGroupTitle>
              {fromOption ? (
                <Row
                  label={t("unitRate", { code: fromOption.code })}
                  value={`${dec(fromOption.rate, locale, 4)} MDL`}
                />
              ) : null}
              {toOption ? (
                <Row
                  label={t("unitRate", { code: toOption.code })}
                  value={`${dec(toOption.rate, locale, 4)} MDL`}
                />
              ) : null}
              {fromOption && toOption && Number.isFinite(cross) ? (
                <Row
                  label={t("crossRate", {
                    from: fromOption.code,
                    to: toOption.code,
                  })}
                  value={dec(cross, locale, 4)}
                  tone="total"
                />
              ) : null}

              <RowGroupTitle right={t("perUnit")}>
                {t("groupTable")}
              </RowGroupTitle>
              <ul className="mt-1">
                {options
                  .filter((option) => option.code !== "MDL")
                  .map((option) => {
                    const delta = option.rate - option.prev;
                    const up = delta > 0.00001;
                    const down = delta < -0.00001;
                    return (
                      <li
                        key={option.code}
                        className="flex items-baseline gap-3 border-b border-line/70 py-2 last:border-0"
                      >
                        <span className="w-11 shrink-0 font-sans text-[0.8125rem] font-semibold text-ivory">
                          {option.code}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-sans text-[0.75rem] text-mist">
                          {option.name}
                        </span>
                        <span className="shrink-0 font-sans text-[0.8125rem] font-semibold tabular-nums text-ivory">
                          {dec(option.rate, locale, 4)}
                        </span>
                        <span
                          className={`w-14 shrink-0 text-right font-sans text-[0.6875rem] tabular-nums ${
                            up ? "text-sage" : down ? "text-ember" : "text-mist"
                          }`}
                        >
                          {up ? "▲" : down ? "▼" : "—"}{" "}
                          {delta === 0 ? "" : dec(Math.abs(delta), locale, 4)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </>
        }
      />

      <Disclaimer text={t("disclaimer")} />
    </section>
  );
}
