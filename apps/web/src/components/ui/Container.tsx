import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Lățimea de coloană a portalului. Toate paginile trec prin ea, ca ritmul
 * orizontal să fie identic de la masthead până la footer.
 */

export type ContainerSize = "narrow" | "default" | "wide" | "full";
export type ContainerTag =
  | "div"
  | "section"
  | "header"
  | "footer"
  | "main"
  | "article"
  | "aside"
  | "nav";

export interface ContainerProps {
  children?: ReactNode;
  /** narrow = text lung (articol) · default = grilă · wide = benzi late */
  size?: ContainerSize;
  as?: ContainerTag;
  className?: string;
  id?: string;
  /** elimină padding-ul orizontal (pentru benzi care se lipesc de margini) */
  flush?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * Lățimile utile. `narrow` rămâne pe măsura coloanei de lectură (un rând de
 * text peste ~75 de caractere obosește ochiul), restul s-au lărgit ca pe
 * ecranele mari să încapă trei carduri lângă coloana laterală, nu două.
 */
const SIZES: Record<ContainerSize, string> = {
  narrow: "max-w-[46rem]",
  default: "max-w-[90rem]",
  wide: "max-w-[104rem]",
  full: "max-w-none",
};

export function Container({
  children,
  size = "default",
  as: Tag = "div",
  className,
  id,
  flush = false,
  ...aria
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "relative mx-auto w-full",
        SIZES[size],
        flush ? undefined : "px-5 sm:px-6 lg:px-8",
        className,
      )}
      {...aria}
    >
      {children}
    </Tag>
  );
}

export default Container;
