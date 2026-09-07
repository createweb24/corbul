"use client";

import {
  useId,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "./cn";

/**
 * Câmp de formular unificat: etichetă în Archivo versale, control pe fundal
 * `coal` cu bordură fină care devine aurie la focus, indiciu și eroare sub el.
 *
 * Un singur component acoperă input / textarea / select (`as`), ca formularele
 * din site și din admin să aibă exact același ritm vertical.
 */

export type FieldControl = "input" | "textarea" | "select";

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type FieldChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

export interface FieldProps {
  label?: ReactNode;
  as?: FieldControl;
  type?: string;
  name?: string;
  id?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: FieldChangeEvent) => void;
  /** variantă scurtă: primește direct valoarea */
  onValueChange?: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  placeholder?: string;
  /** mesaj de eroare — colorează bordura și e legat prin aria-describedby */
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url" | "search";
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  rows?: number;
  /** opțiunile pentru `as="select"` */
  options?: FieldOption[];
  /** conținut suplimentar în <select> (optgroup-uri) */
  children?: ReactNode;
  /** textarea monospațiat — editorul de HTML din admin */
  mono?: boolean;
  className?: string;
  inputClassName?: string;
  /** element decorativ în dreapta etichetei (contor de caractere etc.) */
  aside?: ReactNode;
}

const CONTROL = cn(
  "w-full rounded-[var(--radius)] border border-line bg-coal",
  "px-3 py-2.5 font-sans text-[0.9375rem] text-ivory",
  "transition-[border-color,background-color,box-shadow] duration-200 ease-editorial",
  "hover:border-line-2",
  "focus:border-gold focus:bg-coal-2 focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-55",
  "read-only:text-fog",
);

export function Field({
  label,
  as = "input",
  type = "text",
  name,
  id,
  value,
  defaultValue,
  onChange,
  onValueChange,
  onBlur,
  onFocus,
  onKeyDown,
  placeholder,
  error,
  hint,
  required,
  disabled,
  readOnly,
  autoComplete,
  autoFocus,
  inputMode,
  min,
  max,
  step,
  maxLength,
  rows = 5,
  options,
  children,
  mono = false,
  className,
  inputClassName,
  aside,
}: FieldProps) {
  const reactId = useId();
  const fieldId = id ?? (name ? `f-${name}-${reactId}` : `f-${reactId}`);
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  const handleChange = (event: FieldChangeEvent) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  // `readOnly` și `placeholder` nu există pe <select>, de aceea nu intră aici
  const shared = {
    id: fieldId,
    name,
    disabled,
    required,
    autoFocus,
    onBlur,
    onFocus,
    onKeyDown,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: cn(
      CONTROL,
      error ? "border-ember/70 focus:border-ember" : undefined,
      mono
        ? "font-mono text-[0.8125rem] leading-relaxed tracking-tight"
        : undefined,
      inputClassName,
    ),
  } as const;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={fieldId}
            className="kicker kicker-muted cursor-pointer"
          >
            {label}
            {required ? (
              <span aria-hidden="true" className="ml-1 text-gold">
                *
              </span>
            ) : null}
          </label>
          {aside ? <span className="meta">{aside}</span> : null}
        </div>
      ) : null}

      {as === "textarea" ? (
        <textarea
          {...shared}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(shared.className, "resize-y min-h-24")}
        />
      ) : as === "select" ? (
        <select
          {...shared}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(shared.className, "cursor-pointer pr-8")}
        >
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          {children}
        </select>
      ) : (
        <input
          {...shared}
          placeholder={placeholder}
          readOnly={readOnly}
          type={type}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      )}

      {error ? (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="font-sans text-[0.75rem] leading-snug text-ember"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="font-sans text-[0.75rem] leading-snug text-mist"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default Field;
