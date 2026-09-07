import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { romanNumeral } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { cn } from "./cn";
import { microcopy } from "./microcopy";

/**
 * Capul de secțiune: cifră romană + supratitlu auriu + titlu Playfair,
 * cu legătura „Toate" în dreapta și hairline-ul aurie dedesubt.
 *
 * `roman` acceptă trei forme:
 *   • număr  → `romanNumeral(3)` = „III"
 *   • text   → se afișează ca atare
 *   • `true` → numărul vine din contorul CSS: pune `.roman-sections` pe
 *              containerul care grupează secțiunile (vezi globals.css)
 */

export interface SectionHeadProps {
  title: ReactNode;
  kicker?: ReactNode;
  /** destinație pentru „Toate →" (cale fără prefix de limbă) */
  href?: string;
  roman?: number | string | boolean;
  description?: ReactNode;
  linkLabel?: string;
  className?: string;
  id?: string;
  as?: "h2" | "h3";
  locale?: Locale;
  /** linia de sub cap; `false` la capetele din interiorul unui chenar */
  rule?: boolean;
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 transition-transform duration-200 ease-editorial group-hover/all:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="square" />
    </svg>
  );
}

export function SectionHead({
  title,
  kicker,
  href,
  roman,
  description,
  linkLabel,
  className,
  id,
  as: Heading = "h2",
  locale = "ro",
  rule = true,
}: SectionHeadProps) {
  const copy = microcopy(locale);
  const counterDriven = roman === true;
  const romanText =
    typeof roman === "number"
      ? romanNumeral(roman)
      : typeof roman === "string"
        ? roman
        : null;

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {kicker || romanText || counterDriven ? (
            <div className="mb-2 flex items-center gap-3">
              {romanText ? (
                <span className="font-display text-[0.8125rem] font-semibold tracking-[0.1em] text-gold">
                  {romanText}
                </span>
              ) : null}
              {romanText || counterDriven ? (
                <span aria-hidden="true" className="h-px w-6 bg-gold/45" />
              ) : null}
              {kicker ? <span className="kicker">{kicker}</span> : null}
            </div>
          ) : null}

          <Heading
            id={id}
            className={cn(
              "headline text-[1.75rem] leading-[1.1] sm:text-[2rem]",
              counterDriven ? "roman-mark [&::before]:mr-3" : undefined,
            )}
          >
            {title}
          </Heading>

          {description ? (
            <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-fog">
              {description}
            </p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="group/all kicker mb-1.5 hidden shrink-0 items-center gap-2 text-mist transition-colors duration-200 hover:text-gold sm:inline-flex"
          >
            {linkLabel ?? copy.all}
            <Arrow />
          </Link>
        ) : null}
      </div>

      {rule ? <div className="rule-gold mt-4" /> : null}
    </div>
  );
}

export default SectionHead;
