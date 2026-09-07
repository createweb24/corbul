import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import type { PricingSettings } from "@/lib/types";

/**
 * Card auriu de susținere — punte permanentă spre `/abonament`.
 * Prețul afișat vine din setarea `pricing` (opțional: fără el, cardul
 * își pierde doar nota de subsol).
 */

export interface SupportBoxProps {
  pricing?: PricingSettings | null;
  className?: string;
}

export function SupportBox({ pricing, className }: SupportBoxProps) {
  const t = useTranslations("widgets.support");
  const locale = useLocale();

  const price = pricing
    ? formatMoney(pricing.premiumMonthly, locale, pricing.currency)
    : null;

  return (
    <section
      className={`relative overflow-hidden border border-gold/45 bg-coal px-4 py-5 ${className ?? ""}`}
      aria-labelledby="widget-support-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,rgba(212,175,55,0.14),transparent_60%)]"
      />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
          {t("kicker")}
        </p>
        <h2
          id="widget-support-title"
          className="mt-1.5 font-[family-name:var(--font-display)] text-[20px] leading-tight font-semibold tracking-tight text-ivory"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-fog">{t("text")}</p>

        <Button
          href="/abonament"
          variant="gold"
          size="sm"
          className="mt-4"
          iconRight={
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          }
        >
          {t("cta")}
        </Button>

        {price ? (
          <p className="mt-3 text-[11px] text-mist">{t("note", { price })}</p>
        ) : null}
      </div>
    </section>
  );
}

export default SupportBox;
