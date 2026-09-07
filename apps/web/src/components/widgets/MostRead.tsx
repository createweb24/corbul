import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { romanNumeral } from "@/lib/format";
import type { ArticleListDto } from "@/lib/types";

/**
 * Top 6 materiale după vizualizări, numerotate cu cifre romane (I–VI).
 * Datele vin din `GET /api/articles/most-read`, fetch-uit server-side.
 */

export interface MostReadProps {
  articles: ArticleListDto[];
  limit?: number;
}

export function MostRead({ articles, limit = 6 }: MostReadProps) {
  const t = useTranslations("widgets.mostRead");
  const tc = useTranslations("common");
  const items = articles.slice(0, limit);

  return (
    <section
      className="border border-line bg-coal"
      aria-labelledby="widget-most-read-title"
    >
      <div className="h-px bg-gradient-to-r from-gold/60 via-gold/10 to-transparent" />

      <header className="border-b border-line px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
          {t("kicker")}
        </p>
        <h2
          id="widget-most-read-title"
          className="mt-1 font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-ivory"
        >
          {t("title")}
        </h2>
      </header>

      {items.length === 0 ? (
        <p className="px-4 py-5 text-[13px] text-mist">{t("empty")}</p>
      ) : (
        <ol className="divide-y divide-line">
          {items.map((article, index) => (
            <li key={article.id}>
              <Link
                href={`/articol/${article.slug}`}
                className="group flex gap-3 px-4 py-3 transition-colors duration-200 hover:bg-coal-2"
              >
                <span
                  aria-hidden="true"
                  className="w-7 shrink-0 pt-[2px] text-right font-[family-name:var(--font-display)] text-[15px] font-semibold text-gold/70 transition-colors duration-200 group-hover:text-gold"
                >
                  {romanNumeral(index + 1)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-mist">
                    {article.categoryName}
                  </span>
                  <span className="mt-0.5 block font-[family-name:var(--font-display)] text-[15px] leading-snug font-semibold text-ivory decoration-gold/60 underline-offset-4 group-hover:underline">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-[11px] tabular-nums text-mist">
                    {tc("views", { count: article.views })}
                    <span aria-hidden="true"> · </span>
                    {tc("minRead", { count: article.readMin })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default MostRead;
