"use client";

/**
 * 1. Salariu net ⇄ brut (SPEC §8.1)
 * Impozit pe venit 12 %, asigurare medicală angajat 9 %, scutire personală
 * 2 475 MDL/lună (29 700 lei/an, 2026), CAS angajator 24 % — toate
 * editabile în „Avansat".
 * Direcția net → brut se rezolvă prin căutare binară (`grossFromNet`).
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/types";
import {
  clamp,
  DEFAULT_SALARY,
  grossFromNet,
  money,
  numPositive,
  pct,
  round2,
  salaryFromGross,
  type SalaryParams,
} from "./calc-lib";
import {
  Advanced,
  CalcGrid,
  CalcHeader,
  CompositionBar,
  Disclaimer,
  Headline,
  NumberField,
  ParamGrid,
  Row,
  RowGroupTitle,
  Segmented,
} from "./calc-ui";

type Direction = "grossToNet" | "netToGross";

export default function SalaryCalculator({ locale }: { locale: Locale }) {
  const t = useTranslations("tools.salary");
  const g = useTranslations("tools");

  const [direction, setDirection] = useState<Direction>("grossToNet");
  const [amount, setAmount] = useState("12000");
  const [taxRate, setTaxRate] = useState(DEFAULT_SALARY.taxRate);
  const [medicalRate, setMedicalRate] = useState(DEFAULT_SALARY.medicalRate);
  const [exemption, setExemption] = useState(DEFAULT_SALARY.exemption);
  const [socialRate, setSocialRate] = useState(DEFAULT_SALARY.socialRate);

  // cotele rămân sub 100 %: net→brut presupune (1 − m)(1 − t) > 0, altfel
  // căutarea binară ar produce un brut de ordinul 10^16
  const params: SalaryParams = useMemo(
    () => ({
      taxRate: clamp(numPositive(taxRate, 12), 0, 99.99),
      medicalRate: clamp(numPositive(medicalRate, 9), 0, 99.99),
      exemption: numPositive(exemption, 2475),
      socialRate: numPositive(socialRate, 24),
    }),
    [taxRate, medicalRate, exemption, socialRate],
  );

  const result = useMemo(() => {
    const entered = numPositive(amount);
    const gross =
      direction === "grossToNet" ? entered : grossFromNet(entered, params);
    return salaryFromGross(gross, params);
  }, [amount, direction, params]);

  function changeDirection(next: Direction) {
    if (next === direction) return;
    const carried = next === "netToGross" ? result.net : result.gross;
    setAmount(String(round2(carried)));
    setDirection(next);
  }

  const headlineValue =
    direction === "grossToNet" ? result.net : result.gross;

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <Segmented<Direction>
              label={t("direction")}
              value={direction}
              onChange={changeDirection}
              options={[
                { value: "grossToNet", label: t("grossToNet") },
                { value: "netToGross", label: t("netToGross") },
              ]}
            />

            <NumberField
              label={direction === "grossToNet" ? t("gross") : t("net")}
              value={amount}
              onChange={setAmount}
              unit={g("common.mdl")}
              hint={t("amountHint")}
            />

            <Advanced title={g("advanced")} note={g("advancedNote")}>
              <ParamGrid>
                <NumberField
                  compact
                  label={t("params.taxRate")}
                  value={taxRate}
                  onChange={setTaxRate}
                  unit={g("common.percent")}
                />
                <NumberField
                  compact
                  label={t("params.medicalRate")}
                  value={medicalRate}
                  onChange={setMedicalRate}
                  unit={g("common.percent")}
                />
                <NumberField
                  compact
                  label={t("params.exemption")}
                  value={exemption}
                  onChange={setExemption}
                  unit={g("common.mdl")}
                />
                <NumberField
                  compact
                  label={t("params.socialRate")}
                  value={socialRate}
                  onChange={setSocialRate}
                  unit={g("common.percent")}
                />
              </ParamGrid>
            </Advanced>
          </>
        }
        results={
          <>
            <Headline
              label={direction === "grossToNet" ? t("net") : t("gross")}
              value={money(headlineValue, locale)}
              sub={t("annualNet", { value: money(result.net * 12, locale) })}
            />

            <div className="mt-6">
              <RowGroupTitle right={g("common.perMonth")}>
                {t("groupEmployee")}
              </RowGroupTitle>
              <Row label={t("gross")} value={money(result.gross, locale)} />
              <Row
                label={t("medical")}
                hint={pct(params.medicalRate, locale, 1)}
                value={`− ${money(result.medical, locale)}`}
                tone="minus"
              />
              <Row
                label={t("exemptionApplied")}
                value={`− ${money(Math.min(params.exemption, Math.max(0, result.gross - result.medical)), locale)}`}
                tone="muted"
              />
              <Row
                label={t("taxable")}
                value={money(result.taxable, locale)}
                tone="muted"
              />
              <Row
                label={t("incomeTax")}
                hint={pct(params.taxRate, locale, 1)}
                value={`− ${money(result.tax, locale)}`}
                tone="minus"
              />
              <Row
                label={t("net")}
                value={money(result.net, locale)}
                tone="total"
              />

              <div className="mt-5">
                <CompositionBar
                  total={result.gross}
                  formatValue={(value) => money(value, locale)}
                  segments={[
                    {
                      key: "net",
                      label: t("net"),
                      value: result.net,
                      color: "var(--color-sage)",
                    },
                    {
                      key: "medical",
                      label: t("medicalShort"),
                      value: result.medical,
                      color: "var(--color-gold)",
                    },
                    {
                      key: "tax",
                      label: t("incomeTaxShort"),
                      value: result.tax,
                      color: "var(--color-ember)",
                    },
                  ]}
                />
              </div>

              <RowGroupTitle>{t("groupEmployer")}</RowGroupTitle>
              <Row label={t("gross")} value={money(result.gross, locale)} />
              <Row
                label={t("socialEmployer")}
                hint={pct(params.socialRate, locale, 1)}
                value={`+ ${money(result.employerSocial, locale)}`}
              />
              <Row
                label={t("employerCost")}
                value={money(result.employerCost, locale)}
                tone="total"
              />

              <RowGroupTitle>{t("groupIndicators")}</RowGroupTitle>
              <Row
                label={t("employeeBurden")}
                value={pct(result.employeeBurden, locale, 1)}
                tone="muted"
              />
              <Row
                label={t("totalBurden")}
                value={pct(result.totalBurden, locale, 1)}
                tone="muted"
              />
              <Row
                label={t("perDay")}
                value={money(result.net / 21, locale)}
                tone="muted"
              />
            </div>
          </>
        }
      />

      <Disclaimer text={g("disclaimer")} />
      <p className="mt-2 pl-3 font-sans text-[0.75rem] leading-relaxed text-mist">
        {t("legalNote", { exemption: money(params.exemption, locale) })}
      </p>
    </section>
  );
}
