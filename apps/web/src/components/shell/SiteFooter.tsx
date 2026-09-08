import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { NewsletterBox } from "@/components/widgets/NewsletterBox";
import { Link } from "@/i18n/navigation";
import type { ContactSettings } from "@/lib/types";
import { CATEGORY_SLUGS, type NavCategory } from "./MainNav";

/**
 * Subsolul, în trei benzi:
 *   1. identitatea publicației și înscrierea la buletin;
 *   2. patru coloane egale de legături — secțiuni, redacție, publicitate,
 *      contact și legal;
 *   3. disclaimerul editorial și linia de copyright.
 *
 * Coloanele au aceeași lățime la orice lățime de ecran (1 / 2 / 4), ca
 * subsolul să nu mai aibă rânduri rupte în trepte.
 */

/** Adresa comercială — separată de cea a redacției, ca la orice publicație. */
const ADS_EMAIL = "publicitate@corbul.md";

/**
 * Serviciile de publicitate, în ordinea din subsol. `key` este cheia din
 * `messages/*.json`, `slug` este ruta paginii care explică serviciul.
 */
const AD_SERVICES = [
  { key: "advertorials", slug: "advertoriale" },
  { key: "directory", slug: "partener-in-director" },
  { key: "backlinks", slug: "backlinkuri" },
  { key: "guestPost", slug: "guest-post" },
  { key: "event", slug: "promovare-eveniment" },
  { key: "visibility", slug: "vizibilitate-media" },
] as const;

export interface SiteFooterProps {
  categories?: NavCategory[];
  contact?: ContactSettings | null;
  tagline?: string | null;
}

export function SiteFooter({ categories, contact, tagline }: SiteFooterProps) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  const items: NavCategory[] =
    categories && categories.length > 0
      ? categories
      : CATEGORY_SLUGS.map((slug) => ({ slug, name: tn(`cat.${slug}`) }));

  const address = contact?.address_ro;

  const columnTitle =
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-gold";
  const listLink =
    "block py-1.5 text-[14px] text-fog transition-colors duration-200 hover:text-ivory";

  return (
    <footer className="mt-16 border-t border-line bg-coal">
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent"
      />

      <Container className="py-14">
        {/* ---------- 1. identitate + buletin ---------- */}
        <div className="grid gap-10 border-b border-line pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-[26px] leading-none font-bold tracking-tight text-ivory"
            >
              CORBUL<span className="text-gold">.md</span>
            </Link>
            <p className="mt-4 max-w-prose text-[14px] leading-relaxed text-fog">
              {tagline ?? t("about.text")}
            </p>
            <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-mist">
              {t("editorial")}
            </p>
          </div>

          <NewsletterBox variant="footer" className="scroll-mt-24" id="buletin" />
        </div>

        {/* ---------- 2. coloane de legături ---------- */}
        <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label={t("sections.title")}>
            <h2 className={columnTitle}>{t("sections.title")}</h2>
            <ul className="mt-4">
              {items.map((category) => (
                <li key={category.slug}>
                  <Link href={`/${category.slug}`} className={listLink}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("pages.title")}>
            <h2 className={columnTitle}>{t("pages.title")}</h2>
            <ul className="mt-4">
              <li>
                <Link href="/despre" className={listLink}>
                  {t("links.about")}
                </Link>
              </li>
              <li>
                <Link href="/echipa" className={listLink}>
                  {t("links.team")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={listLink}>
                  {t("links.contact")}
                </Link>
              </li>
              <li>
                <Link href="/instrumente" className={listLink}>
                  {t("links.tools")}
                </Link>
              </li>
              <li>
                <Link href="/abonament" className={listLink}>
                  {t("links.subscribe")}
                </Link>
              </li>
              <li>
                <Link href="/cautare" className={listLink}>
                  {t("links.search")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact#pont"
                  className={`${listLink} text-gold hover:text-gold-2`}
                >
                  {t("links.tip")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={t("ads.title")}>
            <h2 className={columnTitle}>{t("ads.title")}</h2>
            <ul className="mt-4">
              {AD_SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/publicitate/${service.slug}`}
                    className={listLink}
                  >
                    {t(`ads.${service.key}`)}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-line/70 pt-2">
                <Link
                  href="/publicitate"
                  className={`${listLink} font-medium text-ivory hover:text-gold`}
                >
                  {t("ads.all")}
                </Link>
              </li>
              <li>
                <Link
                  href="/publicitate/media-kit"
                  className={`${listLink} font-medium text-ivory hover:text-gold`}
                >
                  {t("ads.mediaKit")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={columnTitle}>{t("contact.title")}</h2>
            <ul className="mt-4 space-y-2 text-[14px] text-fog">
              <li>
                <a
                  href={`mailto:${ADS_EMAIL}`}
                  className="transition-colors duration-200 hover:text-ivory"
                >
                  {ADS_EMAIL}
                </a>
              </li>
              {contact?.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors duration-200 hover:text-ivory"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact?.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="tabular-nums transition-colors duration-200 hover:text-ivory"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {address ? <li className="text-mist">{address}</li> : null}
            </ul>

            <nav aria-label={t("legal.title")} className="mt-7">
              <h2 className={columnTitle}>{t("legal.title")}</h2>
              <ul className="mt-4">
                <li>
                  <Link href="/termeni" className={listLink}>
                    {t("links.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialitate" className={listLink}>
                    {t("links.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialitate#cookies" className={listLink}>
                    {t("links.cookies")}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* ---------- 3. disclaimer + copyright ---------- */}
        <div className="mt-12 border-t border-line pt-6">
          <p className="text-[13px] leading-relaxed text-mist">
            {t("disclaimer")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-mist">
              {t("rights", { year: String(new Date().getFullYear()) })}
              {" · "}
              <span className="whitespace-nowrap">
                powered by{" "}
                <a
                  href="https://landings.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mist transition-colors duration-200 hover:text-gold"
                >
                  landings.md
                </a>
              </span>
            </p>
            <div className="flex items-center gap-5 text-[13px]">
              {/* Adminul este un root layout paralel: navigarea trebuie să fie o
                  încărcare completă, nu una prin router. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/admin"
                rel="nofollow"
                className="text-mist transition-colors duration-200 hover:text-gold"
              >
                {t("links.admin")}
              </a>
              <a
                href="#top"
                className="text-mist transition-colors duration-200 hover:text-gold"
              >
                ↑
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default SiteFooter;
