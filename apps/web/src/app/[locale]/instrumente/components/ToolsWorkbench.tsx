"use client";

/**
 * Bancul de lucru al instrumentelor fiscale: navigație verticală (tab-uri)
 * + panoul activ. Selecția se oglindește în adresă (`?tool=`), astfel încât
 * fiecare calculator să poată fi trimis prin link; folosim History API
 * direct, ca schimbarea de filă să nu declanșeze o navigare de server.
 */

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { romanNumeral } from "@/lib/format";
import type { Locale, RateDto } from "@/lib/types";
import { TOOL_IDS, type ToolId } from "./calc-lib";
import ConverterCalculator from "./ConverterCalculator";
import CreditCalculator from "./CreditCalculator";
import CustomsCalculator from "./CustomsCalculator";
import PropertyCalculator from "./PropertyCalculator";
import SalaryCalculator from "./SalaryCalculator";
import VatCalculator from "./VatCalculator";

export interface ToolsWorkbenchProps {
  locale: Locale;
  initialTool: ToolId;
  rates: readonly RateDto[];
  /** cursul EUR (MDL pentru 1 EUR) folosit la devamare */
  eurRate: number;
  /** data cursului, formatată pe server pentru a evita dezacordul de hidratare */
  ratesDate: string | null;
  stale: boolean;
  currentYear: number;
}

export default function ToolsWorkbench({
  locale,
  initialTool,
  rates,
  eurRate,
  ratesDate,
  stale,
  currentYear,
}: ToolsWorkbenchProps) {
  const t = useTranslations("tools");
  const [active, setActive] = useState<ToolId>(initialTool);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = useCallback((tool: ToolId) => {
    setActive(tool);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tool", tool);
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = TOOL_IDS.length;
      let next = index;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          next = (index + 1) % count;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          next = (index - 1 + count) % count;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = count - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      select(TOOL_IDS[next]);
      tabRefs.current[next]?.focus();
    },
    [select],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
      <nav aria-label={t("navLabel")} className="lg:sticky lg:top-6 lg:self-start">
        <div
          role="tablist"
          aria-orientation="vertical"
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0"
        >
          {TOOL_IDS.map((tool, index) => {
            const selected = tool === active;
            return (
              <button
                key={tool}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`tool-tab-${tool}`}
                aria-selected={selected}
                aria-controls={`tool-panel-${tool}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(tool)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`press group relative flex shrink-0 items-start gap-3 border px-4 py-3 text-left transition-colors duration-200 lg:w-full ${
                  selected
                    ? "border-gold/45 bg-coal"
                    : "border-line bg-transparent hover:border-line-2 hover:bg-coal/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-px w-6 shrink-0 font-display text-[0.8125rem] font-semibold tracking-[0.06em] tabular-nums ${
                    selected ? "text-gold" : "text-mist group-hover:text-gold"
                  }`}
                >
                  {romanNumeral(index + 1)}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-sans text-[0.875rem] font-semibold leading-snug ${
                      selected ? "text-ivory" : "text-fog group-hover:text-ivory"
                    }`}
                  >
                    {t(`tabs.${tool}`)}
                  </span>
                  <span className="mt-0.5 hidden font-sans text-[0.6875rem] leading-relaxed text-mist lg:block">
                    {t(`tabsHint.${tool}`)}
                  </span>
                </span>
                {selected ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-px bg-gold"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mt-4 hidden font-sans text-[0.6875rem] leading-relaxed text-mist lg:block">
          {t("navNote")}
        </p>
      </nav>

      {/* Toate panourile rămân montate: trecerea de la un calculator la
          altul și înapoi nu are voie să șteargă ce a introdus utilizatorul. */}
      <div className="min-w-0">
        {TOOL_IDS.map((tool) => (
          <div
            key={tool}
            role="tabpanel"
            id={`tool-panel-${tool}`}
            aria-labelledby={`tool-tab-${tool}`}
            hidden={tool !== active}
            className="min-w-0 rounded-[var(--radius)] border border-line bg-coal/45 p-5 sm:p-7 lg:p-8"
          >
            {tool === "salary" ? <SalaryCalculator locale={locale} /> : null}
            {tool === "customs" ? (
              <CustomsCalculator
                locale={locale}
                eurRate={eurRate}
                ratesDate={ratesDate}
                stale={stale}
                currentYear={currentYear}
              />
            ) : null}
            {tool === "vat" ? <VatCalculator locale={locale} /> : null}
            {tool === "converter" ? (
              <ConverterCalculator
                locale={locale}
                rates={rates}
                ratesDate={ratesDate}
                stale={stale}
              />
            ) : null}
            {tool === "credit" ? <CreditCalculator locale={locale} /> : null}
            {tool === "property" ? (
              <PropertyCalculator locale={locale} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
