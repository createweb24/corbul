"use client";

/**
 * Primitivele vizuale ale instrumentelor fiscale.
 *
 * Calculatoarele au nevoie de câmpuri numerice cu unitate de măsură lipită
 * de control și de o densitate mai mare în grilele de parametri decât oferă
 * `ui/Field`; de aceea controalele sunt scrise aici, dar cu exact aceleași
 * clase de brand din `globals.css` (etichetă `.kicker kicker-muted`, fundal
 * `coal`, bordură aurie la focus, indiciu `text-mist`), astfel încât ritmul
 * vertical și senzația la atingere să fie identice cu restul portalului.
 */

import type { ChangeEvent, ReactNode } from "react";
import { useId } from "react";

/* ------------------------------------------------------------------ */
/* Câmpuri                                                             */
/* ------------------------------------------------------------------ */

interface FieldFrameProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

function FieldFrame({ label, htmlFor, hint, children }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="kicker kicker-muted cursor-pointer">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="font-sans text-[0.75rem] leading-snug text-mist">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-[var(--radius)] border border-line bg-coal px-3 py-2.5 " +
  "font-sans text-[0.9375rem] text-ivory tabular-nums outline-none " +
  "transition-[border-color,background-color] duration-200 ease-editorial " +
  "placeholder:text-mist hover:border-line-2 focus:border-gold focus:bg-coal-2";

export interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** unitate afișată în dreapta câmpului: „MDL", „%", „cm³" */
  unit?: string;
  hint?: string;
  placeholder?: string;
  /** câmp compact, pentru grilele din secțiunea „Avansat" */
  compact?: boolean;
}

/**
 * Intrare numerică tolerantă: `type="text"` + `inputMode="decimal"`, ca
 * utilizatorul să poată scrie și „12 500,40" (virgula e separatorul
 * zecimal în ambele limbi ale portalului).
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  hint,
  placeholder,
  compact = false,
}: NumberFieldProps) {
  const id = useId();
  const handle = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.target.value);

  // rezervăm exact atâta spațiu cât cere unitatea („%" ≠ „EUR/cm³"),
  // altfel eticheta ar acoperi cifrele tastate
  const unitPadding = !unit
    ? ""
    : unit.length <= 2
      ? "pr-9"
      : unit.length <= 4
        ? "pr-14"
        : "pr-24";

  return (
    <FieldFrame label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={handle}
          placeholder={placeholder}
          className={`${CONTROL} ${compact ? "py-1.5 text-[0.875rem]" : ""} ${unitPadding}`}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-sans text-[0.6875rem] font-semibold tracking-[0.1em] text-mist">
            {unit}
          </span>
        ) : null}
      </div>
    </FieldFrame>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  hint?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: SelectFieldProps) {
  const id = useId();
  return (
    <FieldFrame label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL} cursor-pointer appearance-none pr-9`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-coal text-ivory"
            >
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-3 top-1/2 h-2 w-3 -translate-y-1/2 fill-none stroke-gold stroke-[1.4]"
        >
          <path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="square" />
        </svg>
      </div>
    </FieldFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Comutator segmentat (radiogroup)                                    */
/* ------------------------------------------------------------------ */

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  /**
   * una sub alta pe ecrane mici, două coloane la nevoie; `5` așază
   * opțiunile pe rânduri de 2 (mobil) / 3, fără celule goale
   */
  columns?: 2 | 3 | 4 | 5;
}

/**
 * Butoane radio reale, ascunse vizual: browserul ne dă gratuit navigarea cu
 * săgeți, focusul rulant și semantica de grup pentru cititoarele de ecran —
 * lucruri pe care un `role="radio"` pe `<button>` le-ar cere reimplementate.
 */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  columns,
}: SegmentedProps<T>) {
  const name = useId();
  // Cinci opțiuni nu încap pe un rând în coloana de intrări; un flex cu
  // rupere umple rândurile complet (3 + 2), fără celulele goale pe care
  // le-ar lăsa un grid.
  const wrap = columns === 5;
  const layout = wrap
    ? "flex flex-wrap"
    : columns === 4
      ? "grid grid-cols-2 sm:grid-cols-4"
      : columns === 3
        ? "grid grid-cols-3"
        : "grid grid-cols-2";
  const cell = wrap ? "flex-[1_1_45%] sm:flex-[1_1_30%]" : "";

  // fieldset-ul rămâne în flux normal: `display:flex` pe un `<fieldset>`
  // scoate `<legend>` din așezarea obișnuită în WebKit.
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="kicker kicker-muted mb-1.5 p-0">{label}</legend>
      <div
        className={`${layout} gap-px rounded-[var(--radius)] border border-line bg-line p-px`}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={`press cursor-pointer px-3 py-2 text-center font-sans text-[0.8125rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-gold ${cell} ${
                active
                  ? "bg-gold-solid text-on-gold"
                  : "bg-coal text-fog hover:bg-coal-2 hover:text-ivory"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Rezultate                                                           */
/* ------------------------------------------------------------------ */

export interface HeadlineProps {
  label: string;
  value: string;
  /** a doua linie, mai mică — echivalentul în altă valută sau perioadă */
  sub?: string;
  tone?: "gold" | "ivory";
}

/** Cifra principală a fiecărui calculator — Playfair, mare, aurie. */
export function Headline({ label, value, sub, tone = "gold" }: HeadlineProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-gold/35 bg-[image:linear-gradient(180deg,rgba(212,175,55,0.07),transparent_62%)] bg-coal px-5 py-5">
      <p className="kicker">{label}</p>
      <p
        className={`mt-2 font-display text-[2.1rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2.6rem] ${
          tone === "gold" ? "text-gold" : "text-ivory"
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-2 font-sans text-[0.8125rem] text-fog tabular-nums">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export interface RowProps {
  label: string;
  value: string;
  /** a doua coloană de valori (ex. echivalentul în MDL la devamare) */
  value2?: string;
  hint?: string;
  tone?: "default" | "muted" | "minus" | "plus" | "total";
}

/** Linie de detaliere, cu punctat tipografic între etichetă și cifră. */
export function Row({ label, value, value2, hint, tone = "default" }: RowProps) {
  const valueTone =
    tone === "minus"
      ? "text-ember"
      : tone === "plus"
        ? "text-sage"
        : tone === "total"
          ? "text-gold"
          : tone === "muted"
            ? "text-fog"
            : "text-ivory";

  return (
    <div
      className={`flex items-baseline gap-3 py-2 ${
        tone === "total" ? "border-t border-line-2 pt-3" : ""
      }`}
    >
      <span
        className={`min-w-0 font-sans text-[0.8125rem] ${
          tone === "muted" ? "text-mist" : "text-fog"
        } ${tone === "total" ? "font-semibold text-ivory" : ""}`}
      >
        {label}
        {hint ? (
          <span className="ml-1.5 text-[0.6875rem] text-mist">{hint}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className="h-px min-w-4 flex-1 translate-y-[-2px] bg-[repeating-linear-gradient(90deg,var(--color-line-2)_0_1px,transparent_1px_5px)]"
      />
      <span
        className={`shrink-0 font-sans text-[0.875rem] font-semibold tabular-nums ${valueTone} ${
          tone === "total" ? "text-[1rem]" : ""
        }`}
      >
        {value}
      </span>
      {value2 !== undefined ? (
        <span className="w-24 shrink-0 text-right font-sans text-[0.8125rem] tabular-nums text-mist sm:w-28">
          {value2}
        </span>
      ) : null}
    </div>
  );
}

/** Antetul unui bloc de detaliere („Reținerile angajatului"). */
export function RowGroupTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: string;
}) {
  return (
    <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-line pb-1.5 first:mt-0">
      <h3 className="kicker">
        {children}
      </h3>
      {right ? (
        <span className="font-sans text-[0.6875rem] uppercase tracking-[0.12em] text-mist">
          {right}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bară de compoziție (proporții) — CSS pur                            */
/* ------------------------------------------------------------------ */

export interface BarSegment {
  key: string;
  label: string;
  value: number;
  /** culoare CSS (token de temă) */
  color: string;
}

export function CompositionBar({
  segments,
  total,
  formatValue,
}: {
  segments: readonly BarSegment[];
  total: number;
  formatValue: (value: number) => string;
}) {
  const sum = total > 0 ? total : 1;
  return (
    <div className="mt-1">
      <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-obsidian ring-1 ring-line">
        {segments.map((segment) => {
          const share = Math.max(0, (segment.value / sum) * 100);
          if (share <= 0) return null;
          return (
            <span
              key={segment.key}
              title={`${segment.label}: ${formatValue(segment.value)}`}
              style={{ width: `${share}%`, background: segment.color }}
              className="h-full transition-[width] duration-300 ease-editorial"
            />
          );
        })}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((segment) => (
          <li
            key={segment.key}
            className="flex items-center gap-2 font-sans text-[0.75rem] text-fog"
          >
            <span
              aria-hidden="true"
              style={{ background: segment.color }}
              className="h-2 w-2 shrink-0 rounded-[1px]"
            />
            {segment.label}
            <span className="tabular-nums text-mist">
              {formatValue(segment.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Secțiunea „Avansat" + disclaimer                                    */
/* ------------------------------------------------------------------ */

export function Advanced({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-6 rounded-[var(--radius)] border border-line bg-coal/60 open:bg-coal">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 kicker kicker-muted transition-colors duration-200 hover:text-ivory [&::-webkit-details-marker]:hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 10 10"
          className="h-2.5 w-2.5 shrink-0 fill-none stroke-gold stroke-[1.4] transition-transform duration-200 group-open:rotate-90"
        >
          <path d="M3 1 7.5 5 3 9" strokeLinecap="square" />
        </svg>
        {title}
      </summary>
      <div className="border-t border-line px-4 pb-5 pt-4">
        <p className="mb-4 font-sans text-[0.75rem] leading-relaxed text-mist">
          {note}
        </p>
        {children}
      </div>
    </details>
  );
}

/** Avertismentul obligatoriu, prezent la fiecare calculator (SPEC §8). */
export function Disclaimer({ text }: { text: string }) {
  return (
    <p
      role="note"
      className="mt-6 flex items-start gap-2.5 border-l-2 border-gold/60 bg-coal/50 py-2.5 pl-3 pr-3 font-sans text-[0.75rem] leading-relaxed text-mist"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="mt-px h-3.5 w-3.5 shrink-0 fill-none stroke-gold stroke-[1.3]"
      >
        <circle cx="8" cy="8" r="6.6" />
        <path d="M8 4.6v.2M8 7.2v4.2" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Schelet de calculator                                               */
/* ------------------------------------------------------------------ */

export function CalcHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="border-b border-line pb-5">
      <h2 className="headline text-[1.7rem] text-ivory sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl font-serif text-[0.9375rem] leading-relaxed text-fog">
        {description}
      </p>
    </header>
  );
}

/** Două coloane pe ecrane late: intrări la stânga, rezultate la dreapta. */
export function CalcGrid({
  inputs,
  results,
}: {
  inputs: ReactNode;
  results: ReactNode;
}) {
  return (
    <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-9">
      <div className="flex flex-col gap-5">{inputs}</div>
      <div className="lg:border-l lg:border-line lg:pl-9">{results}</div>
    </div>
  );
}

/** Grilă densă pentru parametrii editabili din „Avansat". */
export function ParamGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
  );
}
