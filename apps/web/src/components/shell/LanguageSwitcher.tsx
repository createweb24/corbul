"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Comutator RO|RU. Păstrează ruta curentă (inclusiv `?q=`, `?page=`,
 * `?tool=`) și schimbă doar prefixul de limbă
 * (`localePrefix: 'always'`). Nu folosește `useSearchParams`, ca să nu
 * forțeze ieșirea paginilor din randarea statică: parametrii se citesc
 * din `window.location` abia în handler-ul de clic, deci doar în browser.
 */

export interface LanguageSwitcherProps {
  className?: string;
}

const LABELS: Record<string, string> = { ro: "RO", ru: "RU" };

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("nav");
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: string) => {
    if (next === active || pending) return;
    const query = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );
    startTransition(() => {
      router.replace({ pathname, query }, { locale: next as "ro" | "ru" });
    });
  };

  return (
    <div
      className={`flex items-center ${className ?? ""}`}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((locale, index) => {
        const current = locale === active;
        return (
          <span key={locale} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className="px-1 text-line-2">
                |
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => switchTo(locale)}
              disabled={current || pending}
              aria-current={current ? "true" : undefined}
              lang={locale}
              title={t("switchTo", {
                language: locale === "ru" ? t("languageRu") : t("languageRo"),
              })}
              className={[
                "text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold",
                current
                  ? "cursor-default text-gold"
                  : "text-mist hover:text-ivory",
                pending && !current ? "opacity-60" : "",
              ].join(" ")}
            >
              {LABELS[locale] ?? locale.toUpperCase()}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
