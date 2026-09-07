import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

/**
 * Banda de „ultima oră": eticheta aurie + o bandă rulantă infinită.
 *
 * Bucla e pur CSS: pista conține lista de DOUĂ ori și se translatează cu
 * exact -50%, deci reia din același punct. A doua copie e `aria-hidden`,
 * ca cititoarele de ecran să nu citească totul de două ori. Rularea se
 * oprește la hover și la focus, iar `prefers-reduced-motion` o anulează
 * complet (banda rămâne derulabilă manual).
 */

export interface TickerItem {
  text: string;
  /** rută internă (fără prefixul de limbă), ex. `/articol/slug` */
  href?: string;
}

export interface TickerProps {
  items: Array<string | TickerItem>;
  /** eticheta din stânga; implicit „ULTIMA ORĂ" / «СРОЧНО» */
  label?: string;
  /** secunde pentru o rotație completă; implicit se scalează cu lungimea */
  durationSeconds?: number;
}

const CSS = `
@keyframes corbul-ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes corbul-ticker-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
}
.corbul-ticker__track {
  animation: corbul-ticker-scroll var(--corbul-ticker-duration, 48s) linear infinite;
  will-change: transform;
}
.corbul-ticker:hover .corbul-ticker__track,
.corbul-ticker:focus-within .corbul-ticker__track {
  animation-play-state: paused;
}
.corbul-ticker__pulse {
  animation: corbul-ticker-pulse 1.8s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .corbul-ticker__track { animation: none; }
  .corbul-ticker__pulse { animation: none; }
  .corbul-ticker__viewport { overflow-x: auto; }
}
`;

function normalize(item: string | TickerItem): TickerItem {
  return typeof item === "string" ? { text: item } : item;
}

export function Ticker({ items, label, durationSeconds }: TickerProps) {
  const t = useTranslations("common");
  const entries = items.map(normalize).filter((item) => item.text.trim());

  if (entries.length === 0) return null;

  const totalChars = entries.reduce((sum, item) => sum + item.text.length, 0);
  const duration = durationSeconds ?? Math.min(120, Math.max(28, totalChars / 3));

  const list = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? true : undefined}
    >
      {entries.map((item, index) => (
        <li key={`${item.text}-${index}`} className="flex items-center">
          <span aria-hidden="true" className="px-4 text-gold/60">
            ✦
          </span>
          {item.href ? (
            <Link
              href={item.href}
              tabIndex={hidden ? -1 : undefined}
              className="whitespace-nowrap text-[13px] text-fog decoration-gold/50 underline-offset-4 transition-colors duration-200 hover:text-ivory hover:underline"
            >
              {item.text}
            </Link>
          ) : (
            <span className="whitespace-nowrap text-[13px] text-fog">
              {item.text}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="corbul-ticker border-b border-line bg-coal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Container className="flex items-stretch">
        <div className="flex shrink-0 items-center gap-2 border-r border-line pr-3">
          <span
            aria-hidden="true"
            className="corbul-ticker__pulse inline-block h-1.5 w-1.5 rounded-full bg-ember"
          />
          <span className="py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ember">
            {label ?? t("breaking")}
          </span>
        </div>

        <div
          className="corbul-ticker__viewport relative min-w-0 flex-1 overflow-hidden"
          style={
            {
              maskImage:
                "linear-gradient(to right, transparent 0, #000 28px, #000 calc(100% - 40px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 28px, #000 calc(100% - 40px), transparent 100%)",
            } as CSSProperties
          }
        >
          <div
            className="corbul-ticker__track flex w-max items-center py-2.5"
            style={
              { "--corbul-ticker-duration": `${duration}s` } as CSSProperties
            }
          >
            {list(false)}
            {list(true)}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Ticker;
