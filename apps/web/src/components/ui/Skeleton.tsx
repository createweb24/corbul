import type { CSSProperties } from "react";
import { cn } from "./cn";

/**
 * Stări de încărcare. Sclipirea folosește `--animate-sheen` din `@theme`
 * și se oprește singură la `prefers-reduced-motion` (regula globală).
 */

export interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  /** rotunjire: implicit colțurile drepte ale proiectului */
  circle?: boolean;
  style?: CSSProperties;
}

const SHEEN: CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, var(--color-coal) 0%, var(--color-coal-2) 45%, var(--color-line) 55%, var(--color-coal) 100%)",
  backgroundSize: "200% 100%",
};

export function Skeleton({
  className,
  width,
  height,
  circle = false,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={{ ...SHEEN, width, height, ...style }}
      className={cn(
        "block animate-sheen bg-coal",
        circle ? "rounded-full" : "rounded-[2px]",
        className,
      )}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/** Câteva rânduri de text, ultimul mai scurt — ca într-un paragraf real. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cn("block space-y-2", className)} aria-hidden="true">
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          height={10}
          className={index === lines - 1 ? "w-3/5" : "w-full"}
        />
      ))}
    </span>
  );
}

export interface SkeletonCardProps {
  className?: string;
  cover?: boolean;
}

/** Placeholder cu forma unui `Card variant="standard"`. */
export function SkeletonCard({ className, cover = true }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border border-line bg-coal",
        className,
      )}
      aria-hidden="true"
    >
      {cover ? <Skeleton className="aspect-[16/9] w-full rounded-none" /> : null}
      <div className="space-y-3 p-5">
        <Skeleton width={92} height={12} />
        <Skeleton height={20} className="w-4/5" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export default Skeleton;
