import { cn } from "./cn";

/**
 * RavenMark — semnătura vizuală a brandului Corbul.md.
 *
 * Un corb în profil, cocoțat pe o linie fină: aceeași hairline aurie care
 * traversează tot site-ul devine stinghia păsării. Marca e o siluetă plină —
 * conturul, ochiul și creasta care separă aripa pliată formează un singur
 * traseu cu `fill-rule="evenodd"`, așa că ochiul și linia aripii sunt goluri
 * prin care se vede fundalul. Rămâne lizibilă la 16px (favicon) și la 200px
 * (footer), fără hairline-uri care dispar.
 *
 * Culoarea vine din `currentColor`: `<RavenMark className="text-gold" />`.
 */

export interface RavenMarkProps {
  /** latura casetei, în px (implicit 28) */
  size?: number | string;
  className?: string;
  /** dacă e dat, marca devine imagine cu nume accesibil; altfel e decorativă */
  title?: string;
  /** ascunde stinghia de sub picioare */
  perch?: boolean;
}

/** contur + ochi + creasta aripii — un singur traseu, „evenodd" */
const BODY =
  "M2 35 C7 31 13 25 22 19 C30 9 43 9 48 21 C56 27 64 33 70 43 " +
  "C78 53 84 62 86 73 C96 79 108 88 118 97 L112 108 C100 103 87 94 78 85 " +
  "C72 90 61 88 52 83 C44 78 37 70 36 59 C35 51 32 45 26 41 " +
  "C18 40 9 38 2 35 Z " +
  "M34 26 A3 3 0 1 1 28 26 A3 3 0 1 1 34 26 Z " +
  "M45 27 C62 37 76 54 80 77 C76 77 74 75 73 72 C67 51 58 39 42 31 Z";

/** picioarele — traseu separat, ca suprapunerea peste corp să nu decupeze */
const LEGS = "M52 81 L56.5 81 L56.5 100 L52 100 Z M63 85 L67.5 85 L67.5 100 L63 100 Z";

const PERCH = "M6 100 L114 100 L114 102.5 L6 102.5 Z";

export function RavenMark({
  size = 28,
  className,
  title,
  perch = true,
}: RavenMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill="currentColor"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled ? <title>{title}</title> : null}
      <g transform="translate(1 9)">
        <path fillRule="evenodd" d={BODY} />
        <path d={perch ? `${LEGS} ${PERCH}` : LEGS} />
      </g>
    </svg>
  );
}

export default RavenMark;
