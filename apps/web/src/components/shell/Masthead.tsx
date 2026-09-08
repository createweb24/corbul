import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

/**
 * Capul de ziar: logotipul „CORBUL.md" și tagline-ul din setări.
 *
 * Căutarea și accesul stau doar pe ecran mare (`lg`): pe telefon și tabletă
 * înghesuiau capul de pagină, iar ambele sunt oricum în meniu și în subsol.
 */

export interface MastheadProps {
  /** tagline-ul localizat din `GET /api/settings`; opțional */
  tagline?: string | null;
}

export function Masthead({ tagline }: MastheadProps) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <header className="border-b border-line bg-obsidian">
      <Container className="py-6 sm:py-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
          {/* logotip */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold sm:gap-4"
            aria-label={tc("siteName")}
          >
            <span className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-[40px] leading-[0.92] font-extrabold tracking-[-0.02em] text-ivory sm:text-[50px]">
                CORBUL
                <span className="text-gold">.md</span>
              </span>
              <span className="mt-2 max-w-[34ch] text-[11px] leading-snug uppercase tracking-[0.2em] text-fog">
                {tagline ?? tc("tagline")}
              </span>
            </span>
          </Link>

          {/* acțiuni */}
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              href="/cautare"
              variant="ghost"
              size="md"
              aria-label={t("search")}
              iconLeft={
                <svg
                  viewBox="0 0 24 24"
                  width={15}
                  height={15}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              }
            >
              {t("search")}
            </Button>

            <Button href="/abonament" variant="gold" size="md">
              {t("subscribe")}
            </Button>
          </div>
        </div>
      </Container>

      {/* hairline aurie de brand */}
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />
    </header>
  );
}

export default Masthead;
