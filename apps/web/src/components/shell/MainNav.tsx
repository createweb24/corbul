"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Navigația principală: Acasă + cele 11 secțiuni editoriale.
 * Starea activă vine din `usePathname()` (fără prefixul de limbă).
 * Sub 1024px bara se pliază într-un buton „hamburger" care deschide
 * un panou lateral (dialog modal): focusul intră pe butonul de închidere,
 * Tab ciclează doar în panou, iar la închidere revine pe burger.
 * Panoul se închide la schimbarea rutei și la Esc.
 */

/** Ordinea din SPEC §1 — aceeași în meniu, în subsol și în hartă. */
export const CATEGORY_SLUGS = [
  "investigatii",
  "politica",
  "economie",
  "energie",
  "juridic",
  "finante",
  "infrastructura",
  "coruptie",
  "analize",
  "opinie",
  "business-public",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface NavCategory {
  slug: string;
  name: string;
}

export interface MainNavProps {
  /**
   * Categoriile localizate din API. Dacă lipsesc (API oprit), se
   * folosesc numele din `messages/*.json` (`nav.cat.<slug>`).
   */
  categories?: NavCategory[];
}

export function MainNav({ categories }: MainNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // închide panoul la navigare
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // focusul intră în panou, ciclează înăuntru și revine la închidere
  useFocusTrap(panelRef, open, { initialFocus: closeRef });

  // Esc + blocarea derulării în spatele panoului
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const items: NavCategory[] =
    categories && categories.length > 0
      ? categories
      : CATEGORY_SLUGS.map((slug) => ({ slug, name: t(`cat.${slug}`) }));

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (active: boolean) =>
    [
      "relative whitespace-nowrap px-2 py-3 text-[11px] font-medium uppercase tracking-[0.09em] transition-colors duration-200 xl:px-3 xl:text-[12px] xl:tracking-[0.13em]",
      active ? "text-gold" : "text-fog hover:text-ivory",
    ].join(" ");

  return (
    <nav
      aria-label={t("mainLabel")}
      className="sticky top-0 z-40 border-y border-line bg-obsidian/95 backdrop-blur supports-[backdrop-filter]:bg-obsidian/80"
    >
      <Container className="flex items-center gap-2">
        {/* burger — sub 1024px */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("openMenu")}
          aria-expanded={open}
          aria-controls="corbul-mobile-nav"
          className="-ml-1 flex items-center gap-2 py-3 pr-2 text-fog transition-colors duration-200 hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em]">
            {t("menu")}
          </span>
        </button>

        {/* bara completă — de la 1024px în sus */}
        <ul className="hidden min-w-0 flex-1 items-center justify-between lg:flex">
          <li>
            <Link
              href="/"
              className={linkClass(isActive("/"))}
              aria-current={isActive("/") ? "page" : undefined}
            >
              {t("home")}
              {isActive("/") ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-px bg-gold"
                />
              ) : null}
            </Link>
          </li>
          {items.map((category) => {
            const href = `/${category.slug}`;
            const active = isActive(href);
            return (
              <li key={category.slug}>
                <Link
                  href={href}
                  className={linkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {category.name}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 bottom-0 h-px bg-gold"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/cautare"
          aria-label={t("search")}
          className="ml-auto flex items-center gap-2 py-3 pl-2 text-fog transition-colors duration-200 hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </Link>
      </Container>

      {/* panoul mobil */}
      <div
        id="corbul-mobile-nav"
        hidden={!open}
        className="lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={t("sectionsLabel")}
      >
        <div
          className="fixed inset-0 z-40 bg-obsidian/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          tabIndex={-1}
          className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] flex-col border-r border-line-2 bg-coal shadow-panel outline-none"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
              {t("sections")}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-line text-fog transition-colors duration-200 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto py-1">
            <li>
              <Link
                href="/"
                className={`flex items-center justify-between border-b border-line/70 px-4 py-3 text-[14px] transition-colors duration-200 ${
                  isActive("/") ? "text-gold" : "text-ivory hover:bg-coal-2"
                }`}
                aria-current={isActive("/") ? "page" : undefined}
              >
                {t("home")}
              </Link>
            </li>
            {items.map((category) => {
              const href = `/${category.slug}`;
              const active = isActive(href);
              return (
                <li key={category.slug}>
                  <Link
                    href={href}
                    className={`flex items-center justify-between border-b border-line/70 px-4 py-3 text-[14px] transition-colors duration-200 ${
                      active ? "text-gold" : "text-ivory hover:bg-coal-2"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {category.name}
                    <span
                      aria-hidden="true"
                      className="text-[11px] text-mist"
                    >
                      ›
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Button href="/instrumente" variant="ghost" size="sm" fullWidth>
                {t("tools")}
              </Button>
              <Button href="/contact" variant="ghost" size="sm" fullWidth>
                {t("contact")}
              </Button>
            </div>
            <Button
              href="/abonament"
              variant="gold"
              size="sm"
              fullWidth
              className="mt-2"
            >
              {t("subscribe")}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MainNav;
