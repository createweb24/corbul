"use client";

/**
 * 6. Impozit pe bunuri imobiliare (SPEC §8.6)
 * Valoarea estimată × cota (implicit 0,1 %), rezultat anual și
 * trimestrial. Numărul de rate anuale este editabil în „Avansat".
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/types";
import {
  computeProperty,
  dec,
  money,
  numPositive,
  pct,
  PROPERTY_PRESETS,
  type PropertyPreset,
} from "./calc-lib";
import {
  Advanced,
  CalcGrid,
  CalcHeader,
  Disclaimer,
  Headline,
  NumberField,
  ParamGrid,
  Row,
  RowGroupTitle,
} from "./calc-ui";

const PRESET_KEYS = Object.keys(PROPERTY_PRESETS) as PropertyPreset[];

export default function PropertyCalculator({ locale }: { locale: Locale }) {
  const t = useTranslations("tools.property");
  const g = useTranslations("tools");

  const [value, setValue] = useState("1200000");
  const [rate, setRate] = useState("0.1");
  const [installments, setInstallments] = useState("4");
  const [maxRate, setMaxRate] = useState("0.4");

  const amount = numPositive(value);
  const ratePercent = numPositive(rate, 0.1);
  const parts = Math.max(1, Math.round(numPositive(installments, 4)));
  const legalMax = numPositive(maxRate, 0.4);

  const result = useMemo(
    () => computeProperty(amount, ratePercent),
    [amount, ratePercent],
  );

  const overLimit = ratePercent > legalMax;

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <NumberField
              label={t("value")}
              value={value}
              onChange={setValue}
              unit={g("common.mdl")}
              hint={t("valueHint")}
            />

            <div className="flex flex-col gap-2.5">
              <span className="kicker kicker-muted">
                {t("presets")}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_KEYS.map((key) => {
                  const preset = PROPERTY_PRESETS[key];
                  const active = Math.abs(ratePercent - preset) < 1e-9;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRate(String(preset))}
                      className={`press rounded-[var(--radius)] border px-3.5 py-1.5 font-sans text-[0.8125rem] transition-colors duration-200 ${
                        active
                          ? "border-gold-solid bg-gold-solid text-on-gold"
                          : "border-line bg-coal text-fog hover:border-line-2 hover:text-ivory"
                      }`}
                    >
                      {t(`preset.${key}`)}
                      <span className="ml-2 font-semibold tabular-nums">
                        {dec(preset, locale, 2)} %
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <NumberField
              label={t("rate")}
              value={rate}
              onChange={setRate}
              unit={g("common.percent")}
              hint={
                overLimit
                  ? t("rateOverLimit", { max: dec(legalMax, locale, 2) })
                  : t("rateHint")
              }
            />

            <Advanced title={g("advanced")} note={g("advancedNote")}>
              <ParamGrid>
                <NumberField
                  compact
                  label={t("params.installments")}
                  value={installments}
                  onChange={setInstallments}
                />
                <NumberField
                  compact
                  label={t("params.maxRate")}
                  value={maxRate}
                  onChange={setMaxRate}
                  unit={g("common.percent")}
                />
              </ParamGrid>
            </Advanced>
          </>
        }
        results={
          <>
            <Headline
              label={t("annual")}
              value={money(result.annual, locale)}
              sub={t("annualSub", {
                rate: pct(ratePercent, locale, 3),
                value: money(amount, locale),
              })}
            />

            <div className="mt-6">
              <RowGroupTitle>{t("groupBreakdown")}</RowGroupTitle>
              <Row
                label={t("value")}
                value={money(amount, locale)}
                tone="muted"
              />
              <Row
                label={t("rate")}
                value={pct(ratePercent, locale, 3)}
                tone="muted"
              />
              <Row label={t("annual")} value={money(result.annual, locale)} />
              <Row
                label={t("quarterly")}
                value={money(result.quarterly, locale)}
                tone="total"
              />
              {parts !== 4 ? (
                <Row
                  label={t("installment", { count: parts })}
                  value={money(result.annual / parts, locale)}
                />
              ) : null}
              <Row
                label={t("monthlyReserve")}
                value={money(result.monthly, locale)}
                tone="muted"
              />
              <Row
                label={t("perThousand")}
                value={money((ratePercent / 100) * 1000, locale)}
                tone="muted"
              />
            </div>

            {overLimit ? (
              <p className="mt-5 border-l-2 border-ember pl-3 font-sans text-[0.75rem] leading-relaxed text-ember">
                {t("rateOverLimit", { max: dec(legalMax, locale, 2) })}
              </p>
            ) : null}
          </>
        }
      />

      <Disclaimer text={g("disclaimer")} />
      <p className="mt-2 pl-3 font-sans text-[0.75rem] leading-relaxed text-mist">
        {t("legalNote")}
      </p>
    </section>
  );
}
