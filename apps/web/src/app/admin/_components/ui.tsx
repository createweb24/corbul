"use client";

/**
 * Primitivele vizuale ale panoului — aceeași identitate ca partea publică
 * (obsidian, hairline aurie, Playfair pentru titluri, Archivo pentru
 * interfață), dar densitate de instrument de lucru.
 *
 * Toate sunt scrise de mână în Tailwind v4 peste tokenii din `globals.css`
 * (SPEC §0.6: fără biblioteci UI externe, iconițe SVG proprii).
 */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/components/ui/cn";

/* ------------------------------------------------------------------ */
/* Buton                                                               */
/* ------------------------------------------------------------------ */

export type ButtonVariant = "gold" | "ghost" | "danger" | "quiet";
export type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "press inline-flex items-center justify-center gap-2 border font-sans font-semibold tracking-[0.06em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  gold: "border-gold-solid bg-gold-solid text-on-gold hover:border-gold-solid-2 hover:bg-gold-solid-2",
  ghost: "border-line-2 bg-transparent text-ivory hover:border-gold/60 hover:bg-coal-2 hover:text-gold",
  danger: "border-ember/60 bg-ember/10 text-ember hover:border-ember hover:bg-ember hover:text-on-gold",
  quiet: "border-transparent bg-transparent text-fog hover:text-gold",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.6875rem] uppercase",
  md: "h-10 px-4 text-xs uppercase",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "ghost", size = "md", loading = false, className, children, disabled, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)}
        {...rest}
      >
        {loading ? <Spinner className="size-3.5" /> : null}
        {children}
      </button>
    );
  },
);

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("animate-spin", className ?? "size-4")}
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Câmpuri                                                             */
/* ------------------------------------------------------------------ */

const CONTROL_BASE =
  "w-full border bg-obsidian px-3 py-2 text-sm text-ivory transition-colors duration-200 placeholder:text-mist focus:outline-none disabled:opacity-50";

function controlClass(invalid?: boolean, extra?: string): string {
  return cn(
    CONTROL_BASE,
    invalid
      ? "border-ember/70 focus:border-ember"
      : "border-line hover:border-line-2 focus:border-gold",
    extra,
  );
}

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog"
      >
        {label}
        {required ? <span className="ml-1 text-gold">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-ember">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-mist">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ invalid, mono, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={controlClass(
          invalid,
          cn(mono && "font-mono text-[0.8125rem] tracking-tight", className),
        )}
        {...rest}
      />
    );
  },
);

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  mono?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ invalid, mono, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={controlClass(
          invalid,
          cn(
            "resize-y leading-relaxed",
            mono && "font-mono text-[0.8125rem] leading-6",
            className,
          ),
        )}
        {...rest}
      />
    );
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid, className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn("appearance-none pr-9", className))}
          {...rest}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-mist"
        >
          <path
            d="M3.5 6 8 10.5 12.5 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Comutator (checkbox stilizat)                                       */
/* ------------------------------------------------------------------ */

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "press flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors duration-200 disabled:opacity-45",
        checked
          ? "border-gold/50 bg-gold/8 text-ivory"
          : "border-line bg-obsidian text-fog hover:border-line-2",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-4 w-8 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-gold bg-gold/30" : "border-line-2 bg-coal-2",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-all duration-200",
            checked ? "left-[1.0625rem] bg-gold" : "left-0.5 bg-mist",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs normal-case tracking-normal text-mist">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Etichete                                                            */
/* ------------------------------------------------------------------ */

export type BadgeTone = "gold" | "ok" | "warn" | "danger" | "neutral";

const BADGE_TONE: Record<BadgeTone, string> = {
  gold: "border-gold/50 bg-gold/10 text-gold",
  ok: "border-sage/45 bg-sage/10 text-sage",
  warn: "border-gold-2/50 bg-gold-2/10 text-gold-2",
  danger: "border-ember/50 bg-ember/10 text-ember",
  neutral: "border-line-2 bg-coal-2 text-fog",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] whitespace-nowrap",
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pastilă de categorie colorată din `hue`-ul ei (SPEC §1). */
export function CategoryChip({ name, hue }: { name: string; hue: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em]"
      style={{ color: `hsl(${hue} 48% 68%)` }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0"
        style={{ background: `hsl(${hue} 52% 58%)` }}
      />
      {name}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Suprafețe                                                           */
/* ------------------------------------------------------------------ */

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-coal", className)}>
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  kicker,
  action,
  className,
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <div>
        {kicker ? <p className="kicker mb-1">{kicker}</p> : null}
        <h2 className="font-display text-lg leading-tight text-ivory">{title}</h2>
      </div>
      {action}
    </header>
  );
}

/** Titlu de pagină cu supratitlu auriu și hairline. */
export function PageHead({
  title,
  kicker,
  description,
  action,
}: {
  title: string;
  kicker: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="kicker">{kicker}</p>
          <h1 className="headline mt-2 text-3xl text-ivory sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
      </div>
    </header>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span aria-hidden="true" className="rule-gold-center h-px w-24" />
      <p className="font-display text-lg text-ivory">{title}</p>
      {message ? (
        <p className="max-w-md text-sm leading-relaxed text-mist">{message}</p>
      ) : null}
      {action}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-3 flex-1 animate-pulse bg-coal-2" />
          <div className="h-3 w-24 animate-pulse bg-coal-2" />
          <div className="h-3 w-16 animate-pulse bg-coal-2" />
        </div>
      ))}
    </div>
  );
}

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-ember/40 bg-ember/8 px-4 py-3">
      <p className="text-sm text-ember">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Reîncearcă
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paginare                                                            */
/* ------------------------------------------------------------------ */

export function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (next: number) => void;
}) {
  if (pages <= 1) {
    return (
      <p className="px-4 py-3 text-xs tracking-[0.08em] text-mist sm:px-5">
        {total} {total === 1 ? "înregistrare" : "înregistrări"}
      </p>
    );
  }

  const range: number[] = [];
  for (let index = Math.max(1, page - 2); index <= Math.min(pages, page + 2); index += 1) {
    range.push(index);
  }

  return (
    <nav
      aria-label="Paginare"
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
    >
      <p className="text-xs tracking-[0.08em] text-mist">
        Pagina {page} din {pages} · {total} înregistrări
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="quiet"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Pagina anterioară"
        >
          ‹
        </Button>
        {range[0] > 1 ? <span className="px-1 text-xs text-mist">…</span> : null}
        {range.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPage(index)}
            aria-current={index === page ? "page" : undefined}
            className={cn(
              "h-8 min-w-8 border px-2 font-sans text-xs font-semibold tabular transition-colors duration-200",
              index === page
                ? "border-gold bg-gold/12 text-gold"
                : "border-transparent text-fog hover:border-line-2 hover:text-ivory",
            )}
          >
            {index}
          </button>
        ))}
        {range[range.length - 1] < pages ? (
          <span className="px-1 text-xs text-mist">…</span>
        ) : null}
        <Button
          size="sm"
          variant="quiet"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Pagina următoare"
        >
          ›
        </Button>
      </div>
    </nav>
  );
}
