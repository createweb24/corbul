import type { CSSProperties, ReactNode } from "react";
import { coverSvg } from "@/lib/cover";
import { cn } from "./cn";

/**
 * Coperta generată a unui articol (SPEC §5). SVG determinist din
 * `lib/cover.ts`, inserat direct în DOM — fără fișiere binare, fără request
 * suplimentar, identic pe server și pe client pentru același `seed`.
 *
 * Marcajul e sigur: `coverSvg` construiește el însuși șirul din numere și
 * dintr-un `title` escapat, nu din HTML primit de la utilizator.
 */

export interface CoverProps {
  seed: number;
  hue: number;
  className?: string;
  /** nume accesibil pentru <title> (titlul articolului) */
  title?: string;
  /** dimensiunile sistemului de coordonate (nu pixelii randați) */
  w?: number;
  h?: number;
  /** raport de aspect CSS; `null` îl lasă în seama clasei primite */
  ratio?: string | null;
  /** conținut suprapus (badge-uri, gradient de titlu) */
  children?: ReactNode;
  style?: CSSProperties;
}

export function Cover({
  seed,
  hue,
  className,
  title,
  w = 1200,
  h = 675,
  ratio = "16 / 9",
  children,
  style,
}: CoverProps) {
  const html = coverSvg(seed, hue, { w, h, title });

  return (
    <div
      className={cn("relative overflow-hidden bg-coal", className)}
      style={ratio ? { aspectRatio: ratio, ...style } : style}
    >
      <div
        className="cover-zoom h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {children}
    </div>
  );
}

export default Cover;
