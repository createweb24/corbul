"use client";

/**
 * Previzualizarea live a copertei generate (SPEC §5 / §9).
 * Randarea o face componenta comună `Cover` (A4) peste `lib/cover.ts`;
 * aici adăugăm doar legenda cu seed-ul și pattern-ul dedus din el, ca
 * redactorul să vadă imediat efectul butonului de regenerare.
 */

import { Cover } from "@/components/ui/Cover";
import { cn } from "@/components/ui/cn";
import { coverPatternFor, type CoverPattern } from "@/lib/cover";

const PATTERN_LABEL: Record<CoverPattern, string> = {
  diagonals: "diagonale",
  circles: "cercuri concentrice",
  bars: "bare verticale",
  waves: "valuri",
  grid: "grilă",
  rays: "raze",
};

export interface CoverPreviewProps {
  seed: number;
  hue: number;
  title?: string;
  className?: string;
  /** arată sub imagine seed-ul și pattern-ul */
  caption?: boolean;
}

export function CoverPreview({
  seed,
  hue,
  title,
  className,
  caption = true,
}: CoverPreviewProps) {
  const pattern = coverPatternFor(seed);

  return (
    <figure className={cn("m-0", className)}>
      <Cover
        seed={seed}
        hue={hue}
        title={title || "Copertă generată"}
        className="border border-line"
      />
      {caption ? (
        <figcaption className="mt-1.5 flex items-center justify-between gap-2 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mist">
          <span>seed {seed}</span>
          <span className="text-gold/70">{PATTERN_LABEL[pattern]}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
