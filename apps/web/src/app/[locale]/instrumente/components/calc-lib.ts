/**
 * Instrumente fiscale (SPEC §8) — nucleul de calcul, fără JSX.
 *
 * Tot ce urmează este pur: aceleași intrări dau aceleași ieșiri, ceea ce
 * permite recalcularea la fiecare tastă fără efecte secundare și menține
 * randarea de pe server identică cu cea de pe client (fără dezacorduri de
 * hidratare). Cotele sunt DOAR valori implicite — interfața le expune
 * editabile în secțiunea „Avansat", pentru că legislația se schimbă.
 */

import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale, RateDto } from "@/lib/types";

/* ================================================================== */
/* Identitatea instrumentelor                                          */
/* ================================================================== */

export const TOOL_IDS = [
  "salary",
  "customs",
  "vat",
  "converter",
  "credit",
  "property",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(value: string | undefined | null): value is ToolId {
  return (
    typeof value === "string" && (TOOL_IDS as readonly string[]).includes(value)
  );
}

/**
 * Aliasuri de adresă în română și rusă: linkul partajat rămâne lizibil
 * (`?tool=devamare`), iar identitatea internă a instrumentului nu se schimbă.
 */
const TOOL_ALIASES: Record<string, ToolId> = {
  salariu: "salary",
  зарплата: "salary",
  devamare: "customs",
  растаможка: "customs",
  tva: "vat",
  ндс: "vat",
  valutar: "converter",
  convertor: "converter",
  конвертер: "converter",
  credit: "credit",
  кредит: "credit",
  imobil: "property",
  imobiliar: "property",
  недвижимость: "property",
};

/** Rezolvă valoarea din `?tool=` — id intern sau alias — la un instrument. */
export function resolveToolId(value: string | undefined | null): ToolId | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (isToolId(key)) return key;
  return TOOL_ALIASES[key] ?? null;
}

/* ================================================================== */
/* Numere: citire tolerantă, formatare localizată                      */
/* ================================================================== */

/**
 * Acceptă „12 500,40", „12500.4", „12.500,40" — adică exact ce apucă
 * utilizatorul să scrie. Întoarce `NaN` pentru un câmp gol sau invalid.
 */
export function parseNum(raw: string): number {
  const cleaned = raw
    .replace(/[\s\u00a0\u202f\u2009'’]/g, "")
    .replace(/,/g, ".")
    // dacă au rămas mai multe puncte („12.500.40"), doar ultimul e zecimal
    .replace(/\.(?=.*\.)/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return Number.NaN;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** Ca `parseNum`, dar cu valoare de rezervă — pentru calcule. */
export function num(raw: string, fallback = 0): number {
  const value = parseNum(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** Ca `num`, dar nu coboară sub zero (sume, capacități, durate). */
export function numPositive(raw: string, fallback = 0): number {
  return Math.max(0, num(raw, fallback));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * „12 500,40 MDL" / „8 000,00 EUR" — întotdeauna cu codul ISO, nu cu
 * simbolul: într-o detaliere pe două coloane (EUR · MDL) „8 000,00 €"
 * lângă „160 118,40 MDL" ar arăta neîngrijit.
 */
export function money(
  value: number,
  locale: Locale,
  currency = "MDL",
  digits = 2,
): string {
  if (!Number.isFinite(value)) return "—";
  return formatMoney(value, locale, currency, {
    currencyDisplay: "code",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** „12 500,40" — fără simbol de valută */
export function dec(value: number, locale: Locale, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return formatNumber(value, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** „12,5 %" — argumentul e deja în puncte procentuale */
export function pct(value: number, locale: Locale, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })} %`;
}

/* ================================================================== */
/* 1. Salariu net ⇄ brut                                               */
/* ================================================================== */

export interface SalaryParams {
  /** impozit pe venit, în procente (implicit 12) */
  taxRate: number;
  /** asigurare obligatorie de asistență medicală, angajat (implicit 9) */
  medicalRate: number;
  /**
   * scutire personală lunară, MDL (implicit 2 475 = 29 700 lei/an pentru
   * 2026, art. 33 Cod fiscal, la venit anual impozabil de cel mult 360 000)
   */
  exemption: number;
  /** contribuții de asigurări sociale datorate de angajator (implicit 24) */
  socialRate: number;
}

export const DEFAULT_SALARY: Readonly<Record<keyof SalaryParams, string>> = {
  taxRate: "12",
  medicalRate: "9",
  exemption: "2475",
  socialRate: "24",
};

export interface SalaryBreakdown {
  gross: number;
  medical: number;
  taxable: number;
  tax: number;
  net: number;
  deductions: number;
  employerSocial: number;
  employerCost: number;
  /** rețineri raportate la brut, în procente */
  employeeBurden: number;
  /** rețineri + contribuții patronale raportate la costul total */
  totalBurden: number;
}

export function salaryFromGross(
  gross: number,
  params: SalaryParams,
): SalaryBreakdown {
  const safeGross = Math.max(0, gross);
  const medical = safeGross * (params.medicalRate / 100);
  const taxable = Math.max(0, safeGross - medical - Math.max(0, params.exemption));
  const tax = taxable * (params.taxRate / 100);
  const net = safeGross - medical - tax;
  const employerSocial = safeGross * (params.socialRate / 100);
  const employerCost = safeGross + employerSocial;
  const deductions = medical + tax;

  return {
    gross: safeGross,
    medical,
    taxable,
    tax,
    net,
    deductions,
    employerSocial,
    employerCost,
    employeeBurden: safeGross > 0 ? (deductions / safeGross) * 100 : 0,
    totalBurden:
      employerCost > 0 ? ((deductions + employerSocial) / employerCost) * 100 : 0,
  };
}

/**
 * Net → brut prin căutare binară: funcția `net(brut)` este strict
 * crescătoare (derivata ei este `1 − m − t·(1 − m) > 0` pentru cote
 * subunitare), deci intervalul se poate înjumătăți în siguranță.
 * 80 de iterații coboară eroarea mult sub un ban.
 */
export function grossFromNet(net: number, params: SalaryParams): number {
  const target = Math.max(0, net);
  if (target === 0) return 0;

  let low = target;
  let high = target * 3 + Math.max(0, params.exemption) + 1000;

  // siguranță: extinde capătul superior dacă cotele sunt extreme
  let guard = 0;
  while (salaryFromGross(high, params).net < target && guard < 40) {
    high *= 2;
    guard += 1;
  }

  for (let i = 0; i < 80; i += 1) {
    const middle = (low + high) / 2;
    if (salaryFromGross(middle, params).net < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

/* ================================================================== */
/* 2. Devamare auto                                                    */
/* ================================================================== */

/*
 * Regimul accizei la autoturisme (poziția tarifară 8703) este cel din
 * Anexa nr. 2 la Titlul IV al Codului fiscal: o cotă în LEI pe cm³ care
 * depinde simultan de capacitatea cilindrică și de vechimea vehiculului.
 * Benzina are cinci trepte de capacitate, motorina trei; benzile de
 * vechime sunt aceleași (0–2, 3–4, 5–6, apoi câte un an până la 19 și
 * „20 de ani și mai mult"). Hibridele plătesc 75 % din cotă, hibridele
 * plug-in 50 %, electricele nimic. Peste 600 000 MDL valoare în vamă se
 * adaugă o acciză suplimentară („de lux") de 2–10 % din valoare.
 *
 * Valorile de mai jos sunt cele publicate pentru 2026 (tabelele publice
 * ale Serviciului Vamal, reproduse de devamare.md / rapidasig.md), cu
 * reperele verificate: benzină 1 501–2 000 cm³ la 7 ani = 21,53 MDL/cm³;
 * 1 001–1 500 cm³ la 15 ani = 46,79; la 20+ ani = 71,79.
 */

export type EngineKind = "petrol" | "diesel" | "hybrid" | "plugin" | "electric";

export const ENGINE_KINDS: readonly EngineKind[] = [
  "petrol",
  "diesel",
  "hybrid",
  "plugin",
  "electric",
] as const;

/** `upTo: null` = ultima treaptă/bandă, deschisă la dreapta. */
export interface OpenBand {
  upTo: number | null;
}

export type ExciseBracket = OpenBand;
export type AgeBand = OpenBand;

/**
 * Matricea accizei: `rates[ageIndex][bracketIndex]`, în MDL pe cm³.
 * Rândurile urmează `ages`, coloanele urmează `brackets`.
 */
export interface ExciseMatrix {
  brackets: readonly ExciseBracket[];
  ages: readonly AgeBand[];
  rates: readonly (readonly number[])[];
}

/** Benzile de vechime din Anexa nr. 2 (ani împliniți de la fabricație). */
export const EXCISE_AGES: readonly AgeBand[] = [
  { upTo: 2 },
  { upTo: 4 },
  { upTo: 6 },
  { upTo: 7 },
  { upTo: 8 },
  { upTo: 9 },
  { upTo: 10 },
  { upTo: 11 },
  { upTo: 12 },
  { upTo: 13 },
  { upTo: 14 },
  { upTo: 15 },
  { upTo: 16 },
  { upTo: 17 },
  { upTo: 18 },
  { upTo: 19 },
  { upTo: null },
] as const;

/** Benzină: ≤1000 / 1001–1500 / 1501–2000 / 2001–3000 / >3000 cm³. */
const PETROL_RATES: readonly (readonly number[])[] = [
  [9.56, 12.23, 18.9, 31.14, 55.6], // 0–2 ani
  [10.0, 12.67, 19.34, 31.58, 56.04], // 3–4 ani
  [10.23, 12.9, 19.57, 31.81, 56.27], // 5–6 ani
  [11.25, 14.19, 21.53, 34.99, 61.9], // 7 ani
  [12.38, 15.61, 23.68, 38.49, 68.09], // 8 ani
  [13.62, 17.17, 26.05, 42.34, 74.9], // 9 ani
  [16.34, 20.6, 31.26, 50.81, 89.87], // 10 ani
  [21.24, 26.79, 40.63, 66.05, 116.84], // 11 ani
  [26.24, 31.79, 45.63, 71.05, 121.84], // 12 ani
  [31.24, 36.79, 50.63, 76.05, 126.84], // 13 ani
  [36.24, 41.79, 55.63, 81.05, 131.84], // 14 ani
  [41.24, 46.79, 60.63, 86.05, 136.84], // 15 ani
  [46.24, 51.79, 65.63, 91.05, 141.84], // 16 ani
  [51.24, 56.79, 70.63, 96.05, 146.84], // 17 ani
  [56.24, 61.79, 75.63, 101.05, 151.84], // 18 ani
  [61.24, 66.79, 80.63, 106.05, 156.84], // 19 ani
  [66.24, 71.79, 85.63, 111.05, 161.84], // 20 ani și mai mult
] as const;

export const DEFAULT_EXCISE_PETROL: ExciseMatrix = {
  brackets: [
    { upTo: 1000 },
    { upTo: 1500 },
    { upTo: 2000 },
    { upTo: 3000 },
    { upTo: null },
  ],
  ages: EXCISE_AGES,
  rates: PETROL_RATES,
};

/**
 * Motorină: ≤1500 / 1501–2500 / >2500 cm³. Legea reia pentru motorină
 * coloanele 2, 4 și 5 ale tabelului de benzină.
 */
export const DEFAULT_EXCISE_DIESEL: ExciseMatrix = {
  brackets: [{ upTo: 1500 }, { upTo: 2500 }, { upTo: null }],
  ages: EXCISE_AGES,
  rates: PETROL_RATES.map((row) => [row[1], row[3], row[4]]),
};

/** Matricea de referință pentru un tip de motor (hibridele pornesc de la benzină). */
export function exciseMatrixFor(engine: EngineKind): ExciseMatrix {
  return engine === "diesel" ? DEFAULT_EXCISE_DIESEL : DEFAULT_EXCISE_PETROL;
}

export interface LuxuryTier {
  /** valoare în vamă maximă, MDL; `null` = ultima treaptă */
  upTo: number | null;
  /** procente din valoarea în vamă */
  percent: number;
}

/**
 * Acciza suplimentară pentru autoturismele cu valoarea în vamă peste
 * 600 000 MDL — procent aplicat întregii valori, pe trepte.
 */
export const LUXURY_TIERS: readonly LuxuryTier[] = [
  { upTo: 700_000, percent: 2 },
  { upTo: 800_000, percent: 3 },
  { upTo: 900_000, percent: 4 },
  { upTo: 1_000_000, percent: 5 },
  { upTo: 1_200_000, percent: 6 },
  { upTo: 1_400_000, percent: 7 },
  { upTo: 1_600_000, percent: 8 },
  { upTo: 1_800_000, percent: 9 },
  { upTo: null, percent: 10 },
] as const;

export interface CustomsParams {
  /** TVA la import, procente (implicit 20; amânată pentru persoane fizice) */
  vatRate: number;
  /** taxa pentru proceduri vamale, procente din valoarea vamală (0,4) */
  feeRate: number;
  /** plafon maxim al taxei de proceduri la import, EUR (1 800) */
  feeMax: number;
  /** taxa vamală, procente (0 pentru originea preferențială UE) */
  dutyRate: number;
  /** cota de acciză pentru hibride, ca fracție din cota de bază (0,75) */
  hybridCoef: number;
  /** cota de acciză pentru hibridele plug-in (0,5) */
  pluginCoef: number;
  /** pragul de la care se aplică acciza suplimentară, MDL (600 000) */
  luxuryThresholdMdl: number;
}

export const DEFAULT_CUSTOMS: Readonly<Record<keyof CustomsParams, string>> = {
  vatRate: "20",
  feeRate: "0.4",
  feeMax: "1800",
  dutyRate: "0",
  hybridCoef: "0.75",
  pluginCoef: "0.5",
  luxuryThresholdMdl: "600000",
};

export interface CustomsInput {
  engine: EngineKind;
  /** capacitate cilindrică, cm³ */
  capacity: number;
  /** vechime, în ani împliniți */
  ageYears: number;
  /** valoare vamală, EUR */
  valueEur: number;
  /** matricea de acciză folosită (benzină sau motorină, eventual editată) */
  excise: ExciseMatrix;
  params: CustomsParams;
  /** MDL pentru 1 EUR */
  eurRate: number;
}

export interface CustomsResult {
  exempt: boolean;
  bracketIndex: number;
  ageIndex: number;
  /** cota din matrice, MDL/cm³ */
  rateMdlPerCc: number;
  /** 1 benzină/motorină, 0,75 hibrid, 0,5 plug-in, 0 electric */
  engineCoef: number;
  /** acciza de bază: cm³ × cotă × coeficient, MDL */
  exciseMdl: number;
  /** aceeași acciză, în EUR, informativ */
  exciseEur: number;
  /** procentul accizei suplimentare aplicat (0 sub prag) */
  luxuryPercent: number;
  luxuryMdl: number;
  luxuryEur: number;
  dutyEur: number;
  vatBaseEur: number;
  vatEur: number;
  feeEur: number;
  totalEur: number;
  totalMdl: number;
  /** valoare vamală + toate taxele, EUR */
  landedEur: number;
}

/** Indexul primei benzi al cărei plafon acoperă valoarea (ultima e deschisă). */
export function pickBand(bands: readonly OpenBand[], value: number): number {
  for (let i = 0; i < bands.length; i += 1) {
    const limit = bands[i].upTo;
    if (limit === null || value <= limit) return i;
  }
  return Math.max(0, bands.length - 1);
}

export function engineCoefficient(
  engine: EngineKind,
  params: CustomsParams,
): number {
  switch (engine) {
    case "electric":
      return 0;
    case "hybrid":
      return Math.max(0, params.hybridCoef);
    case "plugin":
      return Math.max(0, params.pluginCoef);
    default:
      return 1;
  }
}

/** Procentul accizei suplimentare pentru o valoare în vamă în MDL. */
export function luxuryPercentFor(
  valueMdl: number,
  thresholdMdl: number,
  tiers: readonly LuxuryTier[] = LUXURY_TIERS,
): number {
  if (!(valueMdl > Math.max(0, thresholdMdl))) return 0;
  return tiers[pickBand(tiers, valueMdl)]?.percent ?? 0;
}

export function computeCustoms(input: CustomsInput): CustomsResult {
  const { params, excise } = input;
  const capacity = Math.max(0, input.capacity);
  const valueEur = Math.max(0, input.valueEur);
  const years = Math.max(0, Math.floor(input.ageYears));
  // fără un curs valid nu există echivalent în lei/euro — cifrele derivate
  // devin NaN și se afișează ca „—", nu ca zero înșelător
  const rate = input.eurRate > 0 ? input.eurRate : Number.NaN;

  const bracketIndex = pickBand(excise.brackets, capacity);
  const ageIndex = pickBand(excise.ages, years);
  const rateMdlPerCc = Math.max(0, excise.rates[ageIndex]?.[bracketIndex] ?? 0);
  const engineCoef = engineCoefficient(input.engine, params);
  const exempt = input.engine === "electric";

  const exciseMdl = exempt ? 0 : capacity * rateMdlPerCc * engineCoef;
  const exciseEur = exciseMdl === 0 ? 0 : exciseMdl / rate;

  const valueMdl = valueEur * rate;
  const luxuryPercent = luxuryPercentFor(valueMdl, params.luxuryThresholdMdl);
  const luxuryMdl = luxuryPercent > 0 ? valueMdl * (luxuryPercent / 100) : 0;
  const luxuryEur = luxuryPercent > 0 ? valueEur * (luxuryPercent / 100) : 0;

  const dutyEur = valueEur * (Math.max(0, params.dutyRate) / 100);
  const vatBaseEur = valueEur + dutyEur + exciseEur + luxuryEur;
  const vatEur = vatBaseEur * (Math.max(0, params.vatRate) / 100);
  const feeEur =
    valueEur > 0
      ? Math.min(
          valueEur * (Math.max(0, params.feeRate) / 100),
          Math.max(0, params.feeMax),
        )
      : 0;

  const totalEur = exciseEur + luxuryEur + dutyEur + vatEur + feeEur;

  return {
    exempt,
    bracketIndex,
    ageIndex,
    rateMdlPerCc,
    engineCoef,
    exciseMdl,
    exciseEur,
    luxuryPercent,
    luxuryMdl,
    luxuryEur,
    dutyEur,
    vatBaseEur,
    vatEur,
    feeEur,
    totalEur,
    totalMdl: totalEur * rate,
    landedEur: valueEur + totalEur,
  };
}

/* ================================================================== */
/* 3. TVA                                                              */
/* ================================================================== */

export type VatMode = "add" | "extract";

/**
 * Cotele din art. 96 Cod fiscal: 20 % standard, 12 % (cazare, alimentație
 * publică), 8 % (pâine, lactate, medicamente, gaze naturale și lichefiate).
 */
export const VAT_PRESETS: readonly number[] = [20, 12, 8] as const;

export interface VatResult {
  base: number;
  vat: number;
  total: number;
  /** ponderea TVA în suma cu TVA, procente */
  share: number;
}

export function computeVat(
  amount: number,
  ratePercent: number,
  mode: VatMode,
): VatResult {
  const value = Math.max(0, amount);
  const rate = Math.max(0, ratePercent) / 100;

  const base = mode === "add" ? value : value / (1 + rate);
  const total = mode === "add" ? value * (1 + rate) : value;
  const vat = total - base;

  return {
    base,
    vat,
    total,
    share: total > 0 ? (vat / total) * 100 : 0,
  };
}

/* ================================================================== */
/* 4. Convertor valutar (BNM)                                          */
/* ================================================================== */

export interface CurrencyOption {
  code: string;
  name: string;
  /** MDL pentru 1 unitate */
  rate: number;
  /** cursul de referință anterior (pentru săgeata ↑↓) */
  prev: number;
}

/**
 * Valorile de rezervă din SPEC §4 — folosite dacă `/api/widgets` nu
 * răspunde, ca instrumentul să rămână utilizabil.
 */
export const FALLBACK_RATES: readonly RateDto[] = [
  { code: "EUR", nameRo: "Euro", nameRu: "Евро", rate: 19.42, prev: 19.38 },
  { code: "USD", nameRo: "Dolar SUA", nameRu: "Доллар США", rate: 16.61, prev: 16.55 },
  { code: "RON", nameRo: "Leu românesc", nameRu: "Румынский лей", rate: 3.9, prev: 3.89 },
  { code: "RUB", nameRo: "Rublă rusească", nameRu: "Российский рубль", rate: 0.205, prev: 0.207 },
  { code: "UAH", nameRo: "Grivnă ucraineană", nameRu: "Украинская гривна", rate: 0.401, prev: 0.399 },
  { code: "GBP", nameRo: "Liră sterlină", nameRu: "Фунт стерлингов", rate: 22.41, prev: 22.3 },
] as const;

/** Cursul EUR/MDL folosit la devamare, cu rezervă dacă lipsește. */
export function eurRateOf(rates: readonly RateDto[]): number {
  const eur = rates.find((rate) => rate.code === "EUR");
  return eur && eur.rate > 0 ? eur.rate : 19.42;
}

/**
 * Lista de valute pentru convertor: leul moldovenesc (cursul 1, prin
 * definiție) plus valutele întoarse de BNM.
 */
export function currencyOptions(
  rates: readonly RateDto[],
  locale: Locale,
  mdlName: string,
): CurrencyOption[] {
  const list: CurrencyOption[] = [
    { code: "MDL", name: mdlName, rate: 1, prev: 1 },
  ];
  for (const rate of rates) {
    if (rate.code === "MDL" || !(rate.rate > 0)) continue;
    list.push({
      code: rate.code,
      name: locale === "ru" ? rate.nameRu : rate.nameRo,
      rate: rate.rate,
      prev: rate.prev,
    });
  }
  return list;
}

/** Conversie prin leu: `amount × rate(from) ÷ rate(to)`. */
export function convertAmount(
  amount: number,
  from: CurrencyOption | undefined,
  to: CurrencyOption | undefined,
): number {
  if (!from || !to || !(to.rate > 0)) return Number.NaN;
  return (amount * from.rate) / to.rate;
}

/* ================================================================== */
/* 5. Credit cu anuitate                                               */
/* ================================================================== */

export interface AmortYear {
  /** 1, 2, 3 … */
  year: number;
  principal: number;
  interest: number;
  total: number;
  /** sold rămas la finalul anului */
  balance: number;
}

export interface CreditResult {
  payment: number;
  totalPaid: number;
  totalInterest: number;
  /** dobânda raportată la suma împrumutată, procente */
  overpayShare: number;
  years: AmortYear[];
}

/** Rata anuității: `P·i / (1 − (1+i)^−n)`, cu cazul degenerat i = 0. */
export function annuityPayment(
  principal: number,
  annualPercent: number,
  months: number,
): number {
  const p = Math.max(0, principal);
  const n = Math.max(0, Math.floor(months));
  if (p === 0 || n === 0) return 0;
  const i = Math.max(0, annualPercent) / 100 / 12;
  if (i === 0) return p / n;
  return (p * i) / (1 - Math.pow(1 + i, -n));
}

/**
 * Graficul de amortizare, agregat pe ani. Ultima rată absoarbe rotunjirile,
 * astfel încât soldul final să fie exact zero.
 */
export function amortize(
  principal: number,
  annualPercent: number,
  months: number,
): CreditResult {
  const p = Math.max(0, principal);
  const n = Math.max(0, Math.floor(months));
  const payment = annuityPayment(p, annualPercent, n);

  if (p === 0 || n === 0) {
    return {
      payment: 0,
      totalPaid: 0,
      totalInterest: 0,
      overpayShare: 0,
      years: [],
    };
  }

  const i = Math.max(0, annualPercent) / 100 / 12;
  const years: AmortYear[] = [];
  let balance = p;
  let totalInterest = 0;
  let totalPaid = 0;
  let bucket: AmortYear | null = null;

  for (let month = 1; month <= n; month += 1) {
    const yearIndex = Math.ceil(month / 12);
    if (!bucket || bucket.year !== yearIndex) {
      bucket = {
        year: yearIndex,
        principal: 0,
        interest: 0,
        total: 0,
        balance: 0,
      };
      years.push(bucket);
    }

    const interest = balance * i;
    let toPrincipal = payment - interest;
    if (month === n || toPrincipal > balance) toPrincipal = balance;

    balance = Math.max(0, balance - toPrincipal);
    bucket.principal += toPrincipal;
    bucket.interest += interest;
    bucket.total += toPrincipal + interest;
    bucket.balance = balance;
    totalInterest += interest;
    totalPaid += toPrincipal + interest;
  }

  return {
    payment,
    totalPaid,
    totalInterest,
    overpayShare: p > 0 ? (totalInterest / p) * 100 : 0,
    years,
  };
}

/* ================================================================== */
/* 6. Impozit pe bunuri imobiliare                                     */
/* ================================================================== */

export interface PropertyResult {
  annual: number;
  quarterly: number;
  monthly: number;
}

/**
 * Cotele minime din art. 280 alin. (1) Cod fiscal: bunuri locative 0,1 %
 * (maxim 0,4 %), bunuri cu altă destinație 0,3 %, terenuri agricole cu
 * construcții 0,1 % (maxim 0,3 %). Terenurile agricole fără construcții
 * se impozitează pe hectar (impozit funciar), nu pe valoare.
 */
export const PROPERTY_PRESETS = {
  residential: 0.1,
  commercial: 0.3,
  agricultural: 0.1,
} as const;

export type PropertyPreset = keyof typeof PROPERTY_PRESETS;

export function computeProperty(
  value: number,
  ratePercent: number,
): PropertyResult {
  const annual = Math.max(0, value) * (Math.max(0, ratePercent) / 100);
  return { annual, quarterly: annual / 4, monthly: annual / 12 };
}
