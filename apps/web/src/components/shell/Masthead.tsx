import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { RavenMark } from "@/components/ui/RavenMark";
import { Link } from "@/i18n/navigation";

/**
 * Capul de ziar: marca de corb, logotipul „CORBUL.md", tagline-ul din
 * setări și cele două acțiuni permanente — căutare și abonament.
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
            <RavenMark
              size={54}
              className="text-gold transition-colors duration-200 group-hover:text-gold-2"
            />
            <span className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-[38px] leading-[0.92] font-extrabold tracking-[-0.02em] text-ivory sm:text-[46px]">
                CORBUL
                <span className="text-gold">.md</span>
              </span>
              <span className="mt-1.5 max-w-[34ch] text-[10px] leading-snug uppercase tracking-[0.22em] text-mist">
                {tagline ?? tc("tagline")}
              </span>
            </span>
          </Link>

          {/* acțiuni */}
          <div className="flex items-center gap-2 sm:gap-3">
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
