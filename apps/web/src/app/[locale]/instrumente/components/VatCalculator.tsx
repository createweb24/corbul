"use client";

/**
 * 3. TVA (SPEC §8.3) — adaugă sau extrage taxa, pe cotele din art. 96
 * Cod fiscal (20 / 12 / 8 %) sau pe o cotă personalizată.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/types";
import {
  computeVat,
  dec,
  money,
  numPositive,
  pct,
  VAT_PRESETS,
  type VatMode,
} from "./calc-lib";
import {
  CalcGrid,
  CalcHeader,
  CompositionBar,
  Disclaimer,
  Headline,
  NumberField,
  Row,
  RowGroupTitle,
  Segmented,
} from "./calc-ui";

export default function VatCalculator({ locale }: { locale: Locale }) {
  const t = useTranslations("tools.vat");
  const g = useTranslations("tools");

  const [mode, setMode] = useState<VatMode>("add");
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("20");

  const ratePercent = numPositive(rate, 20);
  const result = useMemo(
    () => computeVat(numPositive(amount), ratePercent, mode),
    [amount, ratePercent, mode],
  );

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <Segmented<VatMode>
              label={t("mode")}
              value={mode}
              onChange={setMode}
              options={[
                { value: "add", label: t("add") },
                { value: "extract", label: t("extract") },
              ]}
            />

            <NumberField
              label={mode === "add" ? t("amountWithout") : t("amountWith")}
              value={amount}
              onChange={setAmount}
              unit={g("common.mdl")}
              hint={mode === "add" ? t("addHint") : t("extractHint")}
            />

            <div className="flex flex-col gap-2.5">
              <span className="kicker kicker-muted">
                {t("rate")}
              </span>
              <div className="flex flex-wrap gap-2">
                {VAT_PRESETS.map((preset) => {
                  const active = Math.abs(ratePercent - preset) < 1e-9;
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRate(String(preset))}
                      className={`press rounded-[var(--radius)] border px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold tabular-nums transition-colors duration-200 ${
                        active
                          ? "border-gold-solid bg-gold-solid text-on-gold"
                          : "border-line bg-coal text-fog hover:border-line-2 hover:text-ivory"
                      }`}
                    >
                      {dec(preset, locale, 0)} %
                    </button>
                  );
                })}
              </div>
              <NumberField
                label={t("custom")}
                value={rate}
                onChange={setRate}
                unit={g("common.percent")}
              />
            </div>
          </>
        }
        results={
          <>
            <Headline
              label={mode === "add" ? t("amountWith") : t("amountWithout")}
              value={money(mode === "add" ? result.total : result.base, locale)}
              sub={t("vatOf", {
                value: money(result.vat, locale),
                rate: pct(ratePercent, locale, 2),
              })}
            />

            <div className="mt-6">
              <RowGroupTitle>{t("groupBreakdown")}</RowGroupTitle>
              <Row label={t("base")} value={money(result.base, locale)} />
              <Row
                label={t("vat")}
                hint={pct(ratePercent, locale, 2)}
                value={money(result.vat, locale)}
                tone="minus"
              />
              <Row
                label={t("total")}
                value={money(result.total, locale)}
                tone="total"
              />
              <Row
                label={t("share")}
                value={pct(result.share, locale, 2)}
                tone="muted"
              />

              <div className="mt-5">
                <CompositionBar
                  total={result.total}
                  formatValue={(value) => money(value, locale)}
                  segments={[
                    {
                      key: "base",
                      label: t("base"),
                      value: result.base,
                      color: "var(--color-sage)",
                    },
                    {
                      key: "vat",
                      label: t("vat"),
                      value: result.vat,
                      color: "var(--color-gold)",
                    },
                  ]}
                />
              </div>

              <RowGroupTitle>{t("groupReference")}</RowGroupTitle>
              <Row
                label={t("refStandard")}
                value="20 %"
                tone="muted"
                hint={t("refStandardHint")}
              />
              <Row
                label={t("refReduced12")}
                value="12 %"
                tone="muted"
                hint={t("refReduced12Hint")}
              />
              <Row
                label={t("refReduced8")}
                value="8 %"
                tone="muted"
                hint={t("refReduced8Hint")}
              />
            </div>
          </>
        }
      />

      <Disclaimer text={g("disclaimer")} />
    </section>
  );
}
