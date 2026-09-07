"use client";

/**
 * 5. Credit cu anuitate (SPEC §8.5)
 * Rată lunară constantă, total plătit, total dobândă și grafic de
 * amortizare pe ani — bare CSS, fără nicio bibliotecă de grafice.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/types";
import { amortize, dec, money, numPositive, pct } from "./calc-lib";
import {
  CalcGrid,
  CalcHeader,
  Disclaimer,
  Headline,
  NumberField,
  Row,
  RowGroupTitle,
  Segmented,
} from "./calc-ui";

type TermUnit = "years" | "months";

export default function CreditCalculator({ locale }: { locale: Locale }) {
  const t = useTranslations("tools.credit");
  const g = useTranslations("tools");

  const [principal, setPrincipal] = useState("150000");
  const [rate, setRate] = useState("9.5");
  const [term, setTerm] = useState("5");
  const [unit, setUnit] = useState<TermUnit>("years");

  const months = useMemo(() => {
    const value = numPositive(term, 0);
    const raw = unit === "years" ? value * 12 : value;
    return Math.min(600, Math.round(raw));
  }, [term, unit]);

  const amount = numPositive(principal);
  const annualRate = numPositive(rate);

  const result = useMemo(
    () => amortize(amount, annualRate, months),
    [amount, annualRate, months],
  );

  const maxYear = result.years.reduce(
    (max, year) => Math.max(max, year.total),
    0,
  );

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <NumberField
              label={t("principal")}
              value={principal}
              onChange={setPrincipal}
              unit={g("common.mdl")}
            />
            <NumberField
              label={t("interest")}
              value={rate}
              onChange={setRate}
              unit={g("common.percent")}
              hint={t("interestHint")}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                label={t("term")}
                value={term}
                onChange={setTerm}
                hint={t("termHint", { months })}
              />
              <Segmented<TermUnit>
                label={t("termUnit")}
                value={unit}
                onChange={setUnit}
                options={[
                  { value: "years", label: g("common.years") },
                  { value: "months", label: g("common.months") },
                ]}
              />
            </div>
          </>
        }
        results={
          <>
            <Headline
              label={t("monthlyPayment")}
              value={money(result.payment, locale)}
              sub={t("paymentsCount", { count: months })}
            />

            <div className="mt-6">
              <RowGroupTitle>{t("groupSummary")}</RowGroupTitle>
              <Row label={t("principal")} value={money(amount, locale)} />
              <Row
                label={t("totalInterest")}
                value={money(result.totalInterest, locale)}
                tone="minus"
                hint={pct(result.overpayShare, locale, 1)}
              />
              <Row
                label={t("totalPaid")}
                value={money(result.totalPaid, locale)}
                tone="total"
              />
              <Row
                label={t("firstPaymentInterest")}
                value={money(
                  amount * (annualRate / 100 / 12),
                  locale,
                )}
                tone="muted"
              />
            </div>
          </>
        }
      />

      {result.years.length > 0 ? (
        <div className="mt-9 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="kicker">
              {t("schedule")}
            </h3>
            <ul className="flex items-center gap-5">
              <li className="flex items-center gap-2 font-sans text-[0.75rem] text-fog">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-[1px] bg-gold"
                />
                {t("principalPart")}
              </li>
              <li className="flex items-center gap-2 font-sans text-[0.75rem] text-fog">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-[1px] bg-ember"
                />
                {t("interestPart")}
              </li>
            </ul>
          </div>

          {/* grafic de amortizare — bare CSS, o coloană pe an */}
          <div className="mt-5 flex h-44 items-end gap-1.5 border-b border-line pb-px">
            {result.years.map((year) => {
              const height = maxYear > 0 ? (year.total / maxYear) * 100 : 0;
              const principalShare =
                year.total > 0 ? (year.principal / year.total) * 100 : 0;
              return (
                <div
                  key={year.year}
                  className="group flex h-full min-w-[8px] flex-1 flex-col justify-end"
                  title={`${t("yearLabel", { year: year.year })} · ${t(
                    "principalPart",
                  )} ${money(year.principal, locale)} · ${t(
                    "interestPart",
                  )} ${money(year.interest, locale)}`}
                >
                  <div
                    style={{ height: `${Math.max(2, height)}%` }}
                    className="flex flex-col justify-end overflow-hidden rounded-t-[2px] transition-[height] duration-300 ease-editorial"
                  >
                    <div
                      style={{ height: `${100 - principalShare}%` }}
                      className="bg-ember/80 transition-colors duration-200 group-hover:bg-ember"
                    />
                    <div
                      style={{ height: `${principalShare}%` }}
                      className="bg-gold/75 transition-colors duration-200 group-hover:bg-gold"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5">
            {result.years.map((year) => (
              <span
                key={year.year}
                className="min-w-[8px] flex-1 text-center font-sans text-[0.625rem] tabular-nums text-mist"
              >
                {year.year}
              </span>
            ))}
          </div>

          <div className="mt-6 max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <caption className="sr-only">{t("schedule")}</caption>
              <thead className="sticky top-0 bg-obsidian">
                <tr>
                  <th
                    scope="col"
                    className="border-b border-line-2 py-2 pr-3 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold"
                  >
                    {g("common.year")}
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line-2 py-2 pr-3 text-right font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold"
                  >
                    {t("principalPart")}
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line-2 py-2 pr-3 text-right font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold"
                  >
                    {t("interestPart")}
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line-2 py-2 text-right font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold"
                  >
                    {t("remaining")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.years.map((year) => (
                  <tr key={year.year} className="hover:bg-coal-2/60">
                    <td className="border-b border-line py-2 pr-3 font-sans text-[0.8125rem] tabular-nums text-fog">
                      {year.year}
                    </td>
                    <td className="border-b border-line py-2 pr-3 text-right font-sans text-[0.8125rem] tabular-nums text-ivory">
                      {dec(year.principal, locale, 0)}
                    </td>
                    <td className="border-b border-line py-2 pr-3 text-right font-sans text-[0.8125rem] tabular-nums text-ember">
                      {dec(year.interest, locale, 0)}
                    </td>
                    <td className="border-b border-line py-2 text-right font-sans text-[0.8125rem] tabular-nums text-mist">
                      {dec(year.balance, locale, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-sans text-[0.6875rem] text-mist">
              {t("tableNote")}
            </p>
          </div>
        </div>
      ) : null}

      <Disclaimer text={t("disclaimer")} />
    </section>
  );
}
