import { useTranslations } from "next-intl";
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
      </div>
    </aside>
  );
}

export default Sidebar;
