import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "./cn";

/**
 * Butoane și legături-buton. Archivo versale, colțuri de 4px, fără umbre
 * de aplicație — registrul e editorial, nu „SaaS".
 *
 * • `variant="gold"`   — acțiunea principală (abonare, plată, salvare)
 * • `variant="ghost"`  — acțiune secundară, contur fin
 * • `variant="danger"` — ștergere (doar în admin)
 *
 * Randare: dacă primește `href` intern → `Link` din `@/i18n/navigation`
 * (adaugă prefixul de limbă). Cu `as="a"` sau href extern → `<a>` simplu.
 */

export type ButtonVariant = "gold" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** implicit: „link" dacă există href intern, altfel „button" */
  as?: "button" | "a" | "link";
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.6875rem] tracking-[0.12em] gap-1.5",
  md: "h-10 px-5 text-[0.75rem] tracking-[0.14em] gap-2",
  lg: "h-12 px-7 text-[0.8125rem] tracking-[0.14em] gap-2.5",
};

const VARIANTS: Record<ButtonVariant, string> = {
  gold: cn(
    "border border-gold-solid bg-gold-solid text-on-gold",
    "hover:bg-gold-solid-2 hover:border-gold-solid-2 hover:text-on-gold",
    "shadow-[0_0_0_0_rgba(212,175,55,0)] hover:shadow-[0_6px_22px_-12px_rgba(212,175,55,0.9)]",
  ),
  ghost: cn(
    "border border-line-2 bg-transparent text-ivory",
    "hover:border-gold/60 hover:bg-coal-2 hover:text-gold",
  ),
  danger: cn(
    "border border-ember/50 bg-transparent text-ember",
    "hover:border-ember hover:bg-ember/10",
  ),
};

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 animate-spin"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const EXTERNAL = /^(https?:|mailto:|tel:|#|\/\/)/i;

export function Button({
  variant = "gold",
  size = "md",
  as,
  href,
  target,
  rel,
  download,
  type = "button",
  fullWidth = false,
  loading = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "press inline-flex items-center justify-center rounded-[var(--radius)]",
    "font-sans font-semibold uppercase whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow] duration-200 ease-editorial",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-disabled:pointer-events-none aria-disabled:opacity-45",
    SIZES[size],
    VARIANTS[variant],
    fullWidth ? "w-full" : undefined,
    className,
  );

  const inner = (
    <>
      {loading ? <Spinner /> : iconLeft}
      {children ? <span>{children}</span> : null}
      {loading ? null : iconRight}
    </>
  );

  const mode = as ?? (href ? (EXTERNAL.test(href) ? "a" : "link") : "button");

  if (href && mode !== "button") {
    const anchorProps = {
      target,
      rel: rel ?? (target === "_blank" ? "noopener noreferrer" : undefined),
      download,
      className: classes,
      "aria-disabled": disabled || loading ? true : undefined,
      title: rest.title,
      id: rest.id,
      "aria-label": rest["aria-label"],
    };

    if (mode === "a" || EXTERNAL.test(href)) {
      return (
        <a href={href} {...anchorProps}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} {...anchorProps}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  );
}

export default Button;
