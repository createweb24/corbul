import { cn } from "./cn";

/**
 * Monogramă de autor: inițiale în Playfair, cerc cu inel auriu subțire.
 * Nu există fotografii în proiect (SPEC §0.7) — identitatea vine din literă.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  initials: string;
  /** cheie de mărime sau valoare exactă în px */
  size?: AvatarSize | number;
  className?: string;
  /** nuanță opțională (ex. a categoriei) pentru inel; implicit auriu */
  hue?: number;
  /** numele complet — devine `title` și nume accesibil */
  name?: string;
}

const PRESETS: Record<AvatarSize, number> = {
  xs: 24,
  sm: 30,
  md: 38,
  lg: 54,
  xl: 78,
};

export function Avatar({
  initials,
  size = "md",
  className,
  hue,
  name,
}: AvatarProps) {
  const px = typeof size === "number" ? size : PRESETS[size];
  const label = (initials || "").slice(0, 3).toUpperCase();
  const hasHue = hue !== undefined && Number.isFinite(hue);
  const h = hasHue ? ((Math.round(hue as number) % 360) + 360) % 360 : 0;

  return (
    <span
      title={name}
      role={name ? "img" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      style={{
        width: px,
        height: px,
        fontSize: Math.max(10, Math.round(px * 0.36)),
        borderColor: hasHue ? `hsl(${h} 40% 46% / 0.55)` : undefined,
        color: hasHue ? `hsl(${h} 58% 72%)` : undefined,
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-gold/45",
        "bg-coal-2 font-display font-semibold text-gold",
        "tracking-[0.04em] select-none",
        className,
      )}
    >
      {label}
    </span>
  );
}

export default Avatar;
