import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/lib/types";
import { cn } from "./cn";
import { microcopy } from "./microcopy";

/**
 * Etichete mici, în Archivo versale spațiate. `tone="cat"` primește nuanța
 * categoriei (`hue` din SPEC §1) și își compune singură culorile în HSL —
 * așa fiecare rubrică are accentul ei fără o paletă hardcodată.
 */

export type BadgeTone = "cat" | "breaking" | "premium" | "ok" | "warn";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  tone?: BadgeTone;
  /** nuanța categoriei (0–360), doar pentru `tone="cat"` */
  hue?: number;
  children?: ReactNode;
  size?: BadgeSize;
  className?: string;
  /** pentru textele implicite (breaking / premium) când nu se dau copii */
  locale?: Locale;
  /** punct/rombul din stânga; implicit doar la breaking și premium */
  marker?: boolean;
  title?: string;
}

const SIZES: Record<BadgeSize, string> = {
  sm: "text-[0.625rem] px-[6px] py-[2px] tracking-[0.16em]",
  md: "text-[0.6875rem] px-2 py-[3px] tracking-[0.18em]",
};

const TONES: Record<Exclude<BadgeTone, "cat">, string> = {
  breaking: "text-ember border-ember/45 bg-ember/10",
  premium: "text-gold border-gold/50 bg-gold/10",
  ok: "text-sage border-sage/40 bg-sage/10",
  warn: "text-gold-2 border-gold-2/45 bg-gold-2/10",
};

function catStyle(hue?: number): CSSProperties | undefined {
  if (hue === undefined || !Number.isFinite(hue)) return undefined;
  const h = ((Math.round(hue) % 360) + 360) % 360;
  return {
    color: `hsl(${h} 62% 70%)`,
    borderColor: `hsl(${h} 40% 44% / 0.5)`,
    backgroundColor: `hsl(${h} 45% 30% / 0.22)`,
  };
}

export function Badge({
  tone = "cat",
  hue,
  children,
  size = "md",
  className,
  locale = "ro",
  marker,
  title,
}: BadgeProps) {
  const copy = microcopy(locale);
  const fallback =
    tone === "breaking"
      ? copy.breaking
      : tone === "premium"
        ? copy.premium
        : null;
  const content = children ?? fallback;
  if (content === null || content === undefined || content === "") return null;

  const showMarker = marker ?? (tone === "breaking" || tone === "premium");

  return (
    <span
      title={title}
      style={tone === "cat" ? catStyle(hue) : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] border font-sans font-semibold whitespace-nowrap uppercase",
        SIZES[size],
        tone === "cat"
          ? "border-gold/40 bg-gold/8 text-gold"
          : TONES[tone],
        className,
      )}
    >
      {showMarker ? (
        <span
          aria-hidden="true"
          className={cn(
            "inline-block bg-current",
            tone === "breaking"
              ? "h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
              : "h-[5px] w-[5px] rotate-45",
          )}
        />
      ) : null}
      {content}
    </span>
  );
}

export default Badge;
