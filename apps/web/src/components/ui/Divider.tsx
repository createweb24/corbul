import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Separatoare. Linia aurie fină e elementul de brand (SPEC §5) — o folosim
 * sub capetele de secțiune, între blocurile de conținut și în footer.
 */

export type DividerVariant = "hair" | "gold" | "center" | "double" | "dots";

export interface DividerProps {
  variant?: DividerVariant;
  /** text scurt centrat pe linie (ex. „* * *", „Continuă") */
  label?: ReactNode;
  className?: string;
}

export function Divider({
  variant = "hair",
  label,
  className,
}: DividerProps) {
  if (label) {
    return (
      <div
        className={cn("flex items-center gap-4", className)}
        role="separator"
        aria-orientation="horizontal"
      >
        <span className="h-px flex-1 bg-line" />
        <span className="kicker whitespace-nowrap">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 text-gold/60",
          className,
        )}
        role="separator"
      >
        <span className="h-1 w-1 rotate-45 bg-current" />
        <span className="h-1 w-1 rotate-45 bg-current" />
        <span className="h-1 w-1 rotate-45 bg-current" />
      </div>
    );
  }

  if (variant === "double") {
    return (
      <div className={cn("space-y-[3px]", className)} role="separator">
        <div className="rule-gold-center" />
        <div className="h-px bg-line" />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        variant === "gold"
          ? "rule-gold"
          : variant === "center"
            ? "rule-gold-center"
            : "rule-hair",
        className,
      )}
    />
  );
}

export default Divider;
