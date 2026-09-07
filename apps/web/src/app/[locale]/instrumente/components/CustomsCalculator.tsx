"use client";

/**
 * 2. Devamare auto (SPEC §8.2)
 *
 * Acciză = capacitate (cm³) × cota din Anexa nr. 2 la Titlul IV al Codului
 * fiscal (MDL/cm³, aleasă după treapta de capacitate ȘI banda de vechime)
 * × coeficient de motorizare (1 benzină/motorină, 0,75 hibrid, 0,5 plug-in,
 * 0 electric). Peste 600 000 MDL valoare în vamă se adaugă acciza
 * suplimentară de 2–10 %. TVA (implicit 20 %, amânată pentru persoane
 * fizice) se aplică peste valoarea vamală + taxa vamală + accize; taxa
 * pentru proceduri vamale este 0,4 % din valoarea vamală, maximum 1 800 EUR.
 * Cursul EUR vine din `/api/widgets` (BNM) și rămâne editabil. Cotele și
 * întreaga matrice de acciză sunt editabile în „Avansat".
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/types";
import {
  computeCustoms,
  DEFAULT_CUSTOMS,
  DEFAULT_EXCISE_DIESEL,
  DEFAULT_EXCISE_PETROL,
  dec,
  ENGINE_KINDS,
  exciseMatrixFor,
  money,
  num,
  numPositive,
  parseNum,
  pct,
  type CustomsParams,
  type EngineKind,
  type ExciseMatrix,
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
  Segmented,
} from "./calc-ui";

export interface CustomsCalculatorProps {
  locale: Locale;
  /** MDL pentru 1 EUR, din `/api/widgets` */
  eurRate: number;
  /** data cursului, deja formatată de server */
  ratesDate: string | null;
  /** true dacă API-ul a servit valori de rezervă */
  stale: boolean;
  currentYear: number;
}

type RateGrid = string[][];

function gridOf(matrix: ExciseMatrix): RateGrid {
  return matrix.rates.map((row) => row.map((value) => String(value)));
}

/** Matricea editată de utilizator, cu valorile implicite drept rezervă. */
function matrixFrom(base: ExciseMatrix, grid: RateGrid): ExciseMatrix {
  return {
    brackets: base.brackets,
    ages: base.ages,
    rates: base.rates.map((row, ageIndex) =>
      row.map((value, bracketIndex) =>
        numPositive(grid[ageIndex]?.[bracketIndex] ?? "", value),
      ),
    ),
  };
}

export default function CustomsCalculator({
  locale,
  eurRate,
  ratesDate,
  stale,
  currentYear,
}: CustomsCalculatorProps) {
  const t = useTranslations("tools.customs");
  const g = useTranslations("tools");

  const [engine, setEngine] = useState<EngineKind>("petrol");
  const [capacity, setCapacity] = useState("1600");
  const [year, setYear] = useState(String(currentYear - 7));
  const [value, setValue] = useState("8000");
  const [rate, setRate] = useState(String(eurRate));

  const [petrolGrid, setPetrolGrid] = useState<RateGrid>(() =>
    gridOf(DEFAULT_EXCISE_PETROL),
  );
  const [dieselGrid, setDieselGrid] = useState<RateGrid>(() =>
    gridOf(DEFAULT_EXCISE_DIESEL),
  );

  const [vatRate, setVatRate] = useState(DEFAULT_CUSTOMS.vatRate);
  const [feeRate, setFeeRate] = useState(DEFAULT_CUSTOMS.feeRate);
  const [feeMax, setFeeMax] = useState(DEFAULT_CUSTOMS.feeMax);
  const [dutyRate, setDutyRate] = useState(DEFAULT_CUSTOMS.dutyRate);
  const [hybridCoef, setHybridCoef] = useState(DEFAULT_CUSTOMS.hybridCoef);
  const [pluginCoef, setPluginCoef] = useState(DEFAULT_CUSTOMS.pluginCoef);
  const [luxuryThreshold, setLuxuryThreshold] = useState(
    DEFAULT_CUSTOMS.luxuryThresholdMdl,
  );

  const params: CustomsParams = useMemo(
    () => ({
      vatRate: numPositive(vatRate, 20),
      feeRate: numPositive(feeRate, 0.4),
      feeMax: numPositive(feeMax, 1800),
      dutyRate: numPositive(dutyRate, 0),
      hybridCoef: numPositive(hybridCoef, 0.75),
      pluginCoef: numPositive(pluginCoef, 0.5),
      luxuryThresholdMdl: numPositive(luxuryThreshold, 600000),
    }),
    [
      vatRate,
      feeRate,
      feeMax,
      dutyRate,
      hybridCoef,
      pluginCoef,
      luxuryThreshold,
    ],
  );

  const isDiesel = engine === "diesel";
  const baseMatrix = exciseMatrixFor(engine);
  const activeGrid = isDiesel ? dieselGrid : petrolGrid;
  const setActiveGrid = isDiesel ? setDieselGrid : setPetrolGrid;

  const excise = useMemo(
    () => matrixFrom(baseMatrix, activeGrid),
    [baseMatrix, activeGrid],
  );

  const ageYears = Math.max(0, currentYear - Math.floor(num(year, currentYear)));
  const valueEur = numPositive(value);
  // un curs de 0 sau invalid ar anula toate echivalentele — revenim la BNM
  const typedRate = parseNum(rate);
  const mdlPerEur = typedRate > 0 ? typedRate : eurRate;

  const result = useMemo(
    () =>
      computeCustoms({
        engine,
        capacity: numPositive(capacity),
        ageYears,
        valueEur,
        excise,
        params,
        eurRate: mdlPerEur,
      }),
    [engine, capacity, ageYears, valueEur, excise, params, mdlPerEur],
  );

  /* Etichetele treptelor: „până la 1 000 cm³", „1 001–1 500 cm³", „peste …" */
  function bracketLabel(index: number): string {
    const current = excise.brackets[index];
    const previous = index > 0 ? excise.brackets[index - 1].upTo : null;
    if (!current || current.upTo === null) {
      return t("bracketOver", { min: dec(previous ?? 0, locale, 0) });
    }
    if (previous === null) {
      return t("bracketUpTo", { max: dec(current.upTo, locale, 0) });
    }
    return t("bracketRange", {
      min: dec(previous + 1, locale, 0),
      max: dec(current.upTo, locale, 0),
    });
  }

  /* Benzile de vechime: „0–2 ani", „3–4 ani", „7 ani", „peste 19 ani" */
  function ageLabel(index: number): string {
    const current = excise.ages[index];
    const previous = index > 0 ? (excise.ages[index - 1].upTo ?? 0) : null;
    if (!current || current.upTo === null) {
      return t("ageBandOver", { years: previous ?? 0 });
    }
    if (previous === null) return t("ageBandNew");
    const from = previous + 1;
    if (from === current.upTo) return t("ageBandYear", { years: from });
    return t("ageBand", { from, to: current.upTo });
  }

  function editCell(ageIndex: number, bracketIndex: number, next: string) {
    setActiveGrid((previous) =>
      previous.map((row, r) =>
        r === ageIndex
          ? row.map((cell, c) => (c === bracketIndex ? next : cell))
          : row,
      ),
    );
  }

  const inMdl = (eur: number) =>
    Number.isFinite(mdlPerEur) && mdlPerEur > 0
      ? money(eur * mdlPerEur, locale)
      : "—";

  const exciseFormula = result.exempt
    ? t("exempt")
    : `${dec(numPositive(capacity), locale, 0)} ${t("unitCc")} × ${dec(result.rateMdlPerCc, locale, 2)} × ${dec(result.engineCoef, locale, 2)}`;

  return (
    <section>
      <CalcHeader title={t("title")} description={t("description")} />

      <CalcGrid
        inputs={
          <>
            <Segmented<EngineKind>
              label={t("engine")}
              value={engine}
              onChange={setEngine}
              columns={5}
              options={ENGINE_KINDS.map((kind) => ({
                value: kind,
                label: t(kind),
              }))}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                label={t("capacity")}
                value={capacity}
                onChange={setCapacity}
                unit={t("unitCc")}
                hint={engine === "electric" ? t("electricExempt") : undefined}
              />
              <NumberField
                label={t("year")}
                value={year}
                onChange={setYear}
                hint={t("age", { years: ageYears })}
              />
            </div>

            <NumberField
              label={t("customsValue")}
              value={value}
              onChange={setValue}
              unit={g("common.eur")}
              hint={t("customsValueHint")}
            />

            <NumberField
              label={t("eurRate")}
              value={rate}
              onChange={setRate}
              unit={g("common.mdl")}
              hint={
                ratesDate
                  ? stale
                    ? t("rateStale")
                    : t("rateFrom", { date: ratesDate })
                  : t("rateStale")
              }
            />

            <Advanced title={g("advanced")} note={g("advancedNote")}>
              <ParamGrid>
                <NumberField
                  compact
                  label={t("params.vatRate")}
                  value={vatRate}
                  onChange={setVatRate}
                  unit={g("common.percent")}
                  hint={t("vatNote")}
                />
                <NumberField
                  compact
                  label={t("params.dutyRate")}
                  value={dutyRate}
                  onChange={setDutyRate}
                  unit={g("common.percent")}
                />
                <NumberField
                  compact
                  label={t("params.feeRate")}
                  value={feeRate}
                  onChange={setFeeRate}
                  unit={g("common.percent")}
                />
                <NumberField
                  compact
                  label={t("params.feeMax")}
                  value={feeMax}
                  onChange={setFeeMax}
                  unit={g("common.eur")}
                />
                <NumberField
                  compact
                  label={t("params.hybridCoef")}
                  value={hybridCoef}
                  onChange={setHybridCoef}
                  unit="×"
                />
                <NumberField
                  compact
                  label={t("params.pluginCoef")}
                  value={pluginCoef}
                  onChange={setPluginCoef}
                  unit="×"
                />
                <NumberField
                  compact
                  label={t("params.luxuryThreshold")}
                  value={luxuryThreshold}
                  onChange={setLuxuryThreshold}
                  unit={g("common.mdl")}
                />
              </ParamGrid>

              <RowGroupTitle right={isDiesel ? t("diesel") : t("petrol")}>
                {t("params.exciseTable")}
              </RowGroupTitle>
              {/* Matricea editabilă: rânduri = vechime, coloane = treaptă.
                  Celula folosită în calcul este marcată cu auriu. */}
              <div className="no-scrollbar mt-3 overflow-x-auto">
                <table className="w-full min-w-[26rem] border-collapse">
                  <caption className="sr-only">
                    {t("params.exciseTable")}
                  </caption>
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="border-b border-line-2 py-2 pr-3 text-left font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold"
                      >
                        {t("ageCoefficient")}
                      </th>
                      {excise.brackets.map((bracket, bracketIndex) => (
                        <th
                          key={bracket.upTo ?? "open"}
                          scope="col"
                          className={`border-b border-line-2 px-1 py-2 text-center font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] ${
                            bracketIndex === result.bracketIndex
                              ? "text-gold"
                              : "text-mist"
                          }`}
                        >
                          {bracketLabel(bracketIndex)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeGrid.map((row, ageIndex) => {
                      const activeRow = ageIndex === result.ageIndex;
                      return (
                        <tr
                          key={excise.ages[ageIndex]?.upTo ?? "open"}
                          className={activeRow ? "bg-coal-2/60" : undefined}
                        >
                          <th
                            scope="row"
                            className={`whitespace-nowrap border-b border-line py-1 pr-3 text-left font-sans text-[0.75rem] font-medium ${
                              activeRow ? "text-ivory" : "text-fog"
                            }`}
                          >
                            {ageLabel(ageIndex)}
                          </th>
                          {row.map((cell, bracketIndex) => {
                            const activeCell =
                              activeRow && bracketIndex === result.bracketIndex;
                            return (
                              <td
                                key={bracketIndex}
                                className="border-b border-line px-1 py-1"
                              >
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  aria-label={`${ageLabel(ageIndex)} · ${bracketLabel(bracketIndex)} (${t("unitExcise")})`}
                                  value={cell}
                                  onChange={(event) =>
                                    editCell(
                                      ageIndex,
                                      bracketIndex,
                                      event.target.value,
                                    )
                                  }
                                  className={`w-full min-w-[3.75rem] rounded-[var(--radius)] border bg-coal px-2 py-1 text-right font-sans text-[0.8125rem] tabular-nums outline-none transition-[border-color,background-color] duration-200 ease-editorial hover:border-line-2 focus:border-gold focus:bg-coal-2 ${
                                    activeCell
                                      ? "border-gold/70 text-gold"
                                      : "border-line text-ivory"
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 font-sans text-[0.6875rem] text-mist">
                {t("unitExcise")}
              </p>
            </Advanced>
          </>
        }
        results={
          <>
            <Headline
              label={t("totalDue")}
              value={money(result.totalMdl, locale)}
              sub={t("totalEur", {
                value: money(result.totalEur, locale, "EUR"),
              })}
            />

            <div className="mt-6">
              <RowGroupTitle right={t("columns")}>
                {t("groupBreakdown")}
              </RowGroupTitle>

              <Row
                label={t("customsValue")}
                value={money(valueEur, locale, "EUR")}
                value2={inMdl(valueEur)}
                tone="muted"
              />
              <Row
                label={t("customsDuty")}
                hint={pct(params.dutyRate, locale, 2)}
                value={money(result.dutyEur, locale, "EUR")}
                value2={inMdl(result.dutyEur)}
              />
              <Row
                label={t("excise")}
                hint={exciseFormula}
                value={money(result.exciseEur, locale, "EUR")}
                value2={money(result.exciseMdl, locale)}
              />
              <Row
                label={t("luxuryExcise")}
                hint={pct(result.luxuryPercent, locale, 0)}
                value={money(result.luxuryEur, locale, "EUR")}
                value2={money(result.luxuryMdl, locale)}
              />
              <Row
                label={t("vatBase")}
                value={money(result.vatBaseEur, locale, "EUR")}
                value2={inMdl(result.vatBaseEur)}
                tone="muted"
              />
              <Row
                label={t("vat")}
                hint={pct(params.vatRate, locale, 2)}
                value={money(result.vatEur, locale, "EUR")}
                value2={inMdl(result.vatEur)}
              />
              <Row
                label={t("procedureFee")}
                hint={pct(params.feeRate, locale, 2)}
                value={money(result.feeEur, locale, "EUR")}
                value2={inMdl(result.feeEur)}
              />
              <Row
                label={t("totalDue")}
                value={money(result.totalEur, locale, "EUR")}
                value2={inMdl(result.totalEur)}
                tone="total"
              />

              <RowGroupTitle>{t("groupHow")}</RowGroupTitle>
              <Row
                label={t("bracket")}
                value={bracketLabel(result.bracketIndex)}
                tone="muted"
              />
              <Row
                label={t("ageCoefficient")}
                value={ageLabel(result.ageIndex)}
                tone="muted"
              />
              <Row
                label={t("exciseRate")}
                value={`${dec(result.rateMdlPerCc, locale, 2)} ${t("unitExcise")}`}
                tone="muted"
              />
              <Row
                label={t("fuelCoefficient")}
                hint={t(engine)}
                value={`× ${dec(result.engineCoef, locale, 2)}`}
                tone="muted"
              />
              <Row
                label={t("landed")}
                value={money(result.landedEur, locale, "EUR")}
                value2={inMdl(result.landedEur)}
                tone="total"
              />
            </div>
          </>
        }
      />

      <Disclaimer text={t("estimateWarning")} />
      <p className="mt-2 pl-3 font-sans text-[0.75rem] leading-relaxed text-mist">
        {t("legalNote")}
      </p>
    </section>
  );
}
