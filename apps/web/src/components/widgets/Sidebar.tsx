import { useTranslations } from "next-intl";
import { AdSlot } from "@/components/ads";
import type { ArticleListDto, PricingSettings, WidgetsDto } from "@/lib/types";
import { MostRead } from "./MostRead";
import { NewsletterBox } from "./NewsletterBox";
import { RatesWidget } from "./RatesWidget";
import { SupportBox } from "./SupportBox";
import { WeatherWidget } from "./WeatherWidget";

/**
 * Coloana laterală a paginilor publice.
 *
 * Toate datele sosesc ca props: fetch-ul se face o singură dată,
 * server-side (`/api/widgets` cu `next: {revalidate: 900}` și
 * `/api/articles/most-read`), în layout sau în pagină. Componenta
 * tolerează lipsa oricărei surse: fiecare bloc dispare separat.
 */

export interface SidebarProps {
  widgets?: WidgetsDto | null;
  mostRead?: ArticleListDto[];
  pricing?: PricingSettings | null;
  /** poziționare sticky pe ecrane late (implicit activă) */
  sticky?: boolean;
  className?: string;
}

export function Sidebar({
  widgets,
  mostRead = [],
  pricing,
  sticky = true,
  className,
}: SidebarProps) {
  const t = useTranslations("widgets");
  const rates = widgets?.rates ?? [];

  return (
    <aside className={`w-full ${className ?? ""}`} aria-label={t("asideLabel")}>
      <div
        className={
          sticky ? "flex flex-col gap-6 lg:sticky lg:top-24" : "flex flex-col gap-6"
        }
      >
        {mostRead.length > 0 ? <MostRead articles={mostRead} /> : null}

        <SupportBox pricing={pricing ?? null} />

        {/* ADS-SPEC §3 — `sidebar_top` înaintea widgetului de vreme */}
        <AdSlot zoneKey="sidebar_top" />

        {widgets?.weather ? (
          <WeatherWidget weather={widgets.weather} stale={widgets.stale} />
        ) : null}

        {rates.length > 0 ? (
          <RatesWidget
            rates={rates}
            fetchedAt={widgets?.fetchedAt ?? null}
            ratesDate={widgets?.ratesDate ?? null}
            stale={widgets?.stale ?? false}
          />
        ) : null}

        <NewsletterBox variant="sidebar" />

        {/* ADS-SPEC §3 cere `sidebar_bottom` „după «Cele mai citite»", pornind
            de la o coloană în care acel bloc era ultimul. Aici „Cele mai
            citite" este PRIMUL widget, iar sub el zgârie-norul de 300×600 ar
            ajunge deasupra zonei numite `sidebar_top`. Păstrăm deci sensul —
            jos de tot — nu litera. */}
        <AdSlot zoneKey="sidebar_bottom" />
      </div>
    </aside>
  );
}

export default Sidebar;
