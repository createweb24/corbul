import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/types";
import { cn } from "./cn";
import { microcopy } from "./microcopy";

/**
 * Paginare. Două moduri, ca să servească și paginile publice, și adminul:
 *   • cu `baseHref` / `hrefFor` → legături reale (bune pentru SEO și SSR)
 *   • cu `onPageChange`        → butoane (liste filtrate din panou)
 */

export interface PaginationProps {
  page: number;
  pages: number;
  /** calea rubricii, fără prefix de limbă: „/economie", „/cautare" */
  baseHref?: string;
  /** parametri păstrați în link (q, category…) */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** control total asupra adresei fiecărei pagini */
  hrefFor?: (page: number) => string;
  /** variantă client: butoane în loc de legături */
  onPageChange?: (page: number) => void;
  locale?: Locale;
  className?: string;
  ariaLabel?: string;
}

const CELL =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius)] border px-3 font-sans text-[0.8125rem] font-medium transition-colors duration-200 ease-editorial";
const IDLE =
  "border-line bg-coal text-fog hover:border-gold/50 hover:bg-coal-2 hover:text-gold";
const CURRENT = "border-gold bg-gold/12 text-gold";
const DISABLED = "border-line/60 bg-transparent text-mist/60 pointer-events-none";

/** [1, '…', 4, 5, 6, '…', 12] */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push("gap");
  for (let index = from; index <= to; index += 1) out.push(index);
  if (to < pages - 1) out.push("gap");
  out.push(pages);
  return out;
}

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 6l-6 6 6 6" strokeLinecap="square" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 6l6 6-6 6" strokeLinecap="square" />
    </svg>
  );
}

export function Pagination({
  page,
  pages,
  baseHref,
  query,
  hrefFor,
  onPageChange,
  locale = "ro",
  className,
  ariaLabel,
}: PaginationProps) {
  const copy = microcopy(locale);
  const total = Math.max(1, Math.floor(pages) || 1);
  const current = Math.min(Math.max(1, Math.floor(page) || 1), total);
  if (total <= 1) return null;

  const buildHref = (value: number): string => {
    if (hrefFor) return hrefFor(value);
    const search = new URLSearchParams();
    for (const [key, entry] of Object.entries(query ?? {})) {
      if (entry === undefined || entry === null || entry === "") continue;
      search.set(key, String(entry));
    }
    if (value > 1) search.set("page", String(value));
    const suffix = search.toString();
    return `${baseHref ?? ""}${suffix ? `?${suffix}` : ""}`;
  };

  const cell = (
    value: number,
    content: ReactNode,
    extra: {
      label?: string;
      disabled?: boolean;
      currentPage?: boolean;
      className?: string;
    } = {},
  ) => {
    const classes = cn(
      CELL,
      extra.disabled ? DISABLED : extra.currentPage ? CURRENT : IDLE,
      extra.className,
    );

    if (extra.disabled) {
      return (
        <span aria-hidden="true" className={classes}>
          {content}
        </span>
      );
    }

    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => onPageChange(value)}
          aria-label={extra.label}
          aria-current={extra.currentPage ? "page" : undefined}
          className={classes}
        >
          {content}
        </button>
      );
    }

    const href = buildHref(value);
    const props = {
      className: classes,
      "aria-label": extra.label,
      "aria-current": extra.currentPage ? ("page" as const) : undefined,
    };

    // fără `baseHref` rămânem pe adresa curentă și schimbăm doar interogarea
    return baseHref ? (
      <Link href={href} {...props}>
        {content}
      </Link>
    ) : (
      <a href={href || "?"} {...props}>
        {content}
      </a>
    );
  };

  return (
    <nav
      aria-label={ariaLabel ?? copy.pagination}
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {cell(current - 1, <ChevronLeft />, {
        label: copy.previous,
        disabled: current <= 1,
      })}

      {pageWindow(current, total).map((entry, index) =>
        entry === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 font-display text-mist"
          >
            …
          </span>
        ) : (
          <span key={entry}>
            {cell(entry, entry, {
              label: `${copy.page} ${entry}`,
              currentPage: entry === current,
            })}
          </span>
        ),
      )}

      {cell(current + 1, <ChevronRight />, {
        label: copy.next,
        disabled: current >= total,
      })}
    </nav>
  );
}

export default Pagination;
