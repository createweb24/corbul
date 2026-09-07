"use client";

/**
 * Piesele mici, comune tuturor filelor de publicitate: antetul de coloană,
 * învelișul derulabil al tabelelor, comutatorul inline de pe rând și rândul de
 * acțiuni. Tot ce e mai mare de atât vine din `_components/ui.tsx`.
 */

import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export function Th({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-mist",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

/**
 * Pe ecran mic tabelele se derulează orizontal, nu se înghesuie.
 * `min-w` se dă de la caz la caz, în funcție de numărul de coloane.
 */
export function TableScroll({
  minWidth = "min-w-[52rem]",
  children,
}: {
  minWidth?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left", minWidth)}
      >
        {children}
      </table>
    </div>
  );
}

/** Comutator inline de tabel — perechea vizuală a marcajelor din Articole. */
export function RowToggle({
  on,
  label,
  busy,
  onToggle,
}: {
  on: boolean;
  label: string;
  busy?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={`${label}: ${on ? "activ" : "inactiv"}`}
      title={label}
      className={cn(
        "press inline-flex items-center gap-2 border px-2 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 disabled:opacity-40",
        on
          ? "border-gold/55 bg-gold/10 text-gold"
          : "border-line text-mist hover:border-line-2 hover:text-fog",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-3 w-6 shrink-0 rounded-full border transition-colors duration-200",
          on ? "border-gold bg-gold/30" : "border-line-2 bg-coal-2",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full transition-all duration-200",
            on ? "left-[0.8125rem] bg-gold" : "left-0.5 bg-mist",
          )}
        />
      </span>
      {on ? "Activ" : "Oprit"}
    </button>
  );
}

/** Zona de acțiuni dintr-o celulă de tabel. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

/** Mesajul de validare al unui formular, deasupra butoanelor. */
export function FormIssue({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mr-auto max-w-md text-xs leading-relaxed text-ember">
      {message}
    </p>
  );
}

/** Cifră de sinteză, în banda de sus a paginii. */
export function StatCell({
  label,
  value,
  note,
  accent,
  loading,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col bg-coal px-4 py-4">
      <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-mist">
        {label}
      </p>
      {loading ? (
        <span aria-hidden="true" className="mt-3 block h-6 w-16 animate-pulse bg-coal-2" />
      ) : (
        <p
          className={cn(
            "mt-2 font-display text-2xl leading-none tabular",
            accent ? "text-gold" : "text-ivory",
          )}
        >
          {value}
        </p>
      )}
      {note ? (
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-mist">{note}</p>
      ) : null}
    </div>
  );
}
