import type { ReactNode } from "react";
import { cn } from "./cn";
import { RavenMark } from "./RavenMark";

/**
 * Stare goală — căutare fără rezultate, rubrică fără articole, listă golită
 * în admin. Corbul rămâne singur pe stinghie: e chiar mesajul.
 */

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** buton sau legătură; se afișează sub descriere */
  action?: ReactNode;
  /** înlocuiește silueta de corb cu altă iconiță */
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius)] border border-dashed border-line bg-coal/60 text-center",
        compact ? "gap-3 px-6 py-10" : "gap-4 px-6 py-16 sm:py-20",
        className,
      )}
    >
      <span className="text-gold/35">
        {icon ?? <RavenMark size={compact ? 40 : 62} />}
      </span>

      <h2
        className={cn(
          "headline text-ivory",
          compact ? "text-lg" : "text-[1.375rem] sm:text-2xl",
        )}
      >
        {title}
      </h2>

      {description ? (
        <p className="max-w-[46ch] text-sm leading-relaxed text-fog">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
