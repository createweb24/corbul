"use client";

/**
 * `/admin/panou` — tabloul de bord (SPEC §9).
 * Carduri de statistici, grafic cu bare CSS pe categorii, ultimele articole,
 * ultimii abonați și starea API-ului.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  AdminArticleListResponse,
  AdminStatsDto,
  CategoryDto,
  HealthDto,
} from "@/lib/types";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";
import {
  Badge,
  CategoryChip,
  EmptyState,
  ErrorNote,
  LoadingRows,
  PageHead,
  Panel,
  PanelHead,
} from "../_components/ui";
import { useAdminUser } from "../_components/AdminShell";
import { adminFetch, errorMessage, publicFetch } from "../_lib/session";

/**
 * Rând din „Ultimele articole”. `stats.recent` (ArticleListDto) nu spune dacă
 * materialul e publicat, așa că lista se citește din `/admin/articles`
 * (forma brută, cu `published`); dacă acea cerere pică, cădem pe
 * `stats.recent` cu `published: null` (necunoscut → fără link public).
 */
interface RecentRow {
  id: number;
  slug: string;
  title: string;
  categoryName: string;
  categoryHue: number;
  authorName: string;
  views: number;
  publishedAt: string;
  featured: boolean;
  breaking: boolean;
  premium: boolean;
  published: boolean | null;
}

interface Snapshot {
  stats: AdminStatsDto;
  categories: CategoryDto[];
  recent: RecentRow[];
}

function recentFromStats(stats: AdminStatsDto): RecentRow[] {
  return stats.recent.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    categoryName: article.categoryName,
    categoryHue: article.categoryHue,
    authorName: article.author.name,
    views: article.views,
    publishedAt: article.publishedAt,
    featured: article.featured,
    breaking: article.breaking,
    premium: article.premium,
    published: null,
  }));
}

function recentFromAdmin(list: AdminArticleListResponse): RecentRow[] {
  return list.items.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.titleRo,
    categoryName: article.category?.nameRo ?? "—",
    categoryHue: article.category?.hue ?? 42,
    authorName: article.author?.name ?? "—",
    views: article.views,
    publishedAt: article.publishedAt,
    featured: article.featured,
    breaking: article.breaking,
    premium: article.premium,
    published: article.published,
  }));
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "lunar",
  annual: "anual",
};

const SUBSCRIBER_TONE = {
  active: "ok",
  pending: "warn",
  past_due: "danger",
  canceled: "neutral",
} as const;

export default function PanouPage() {
  const user = useAdminUser();
  const [data, setData] = useState<Snapshot | null>(null);
  const [health, setHealth] = useState<HealthDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, categories, recentList] = await Promise.all([
        adminFetch<AdminStatsDto>("/admin/stats"),
        publicFetch<CategoryDto[]>("/categories?locale=ro").catch(
          () => [] as CategoryDto[],
        ),
        adminFetch<AdminArticleListResponse>(
          "/admin/articles?page=1&perPage=8",
        ).catch(() => null),
      ]);
      setData({
        stats,
        categories,
        recent: recentList ? recentFromAdmin(recentList) : recentFromStats(stats),
      });
    } catch (caught) {
      setError(errorMessage(caught, "Statisticile nu au putut fi încărcate."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    publicFetch<HealthDto>("/health")
      .then((result) => {
        if (alive) setHealth(result);
      })
      .catch(() => {
        if (alive) setHealth(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = data?.stats;
  const hueOf = (slug: string): number =>
    data?.categories.find((category) => category.slug === slug)?.hue ?? 42;
  const maxCount = stats
    ? Math.max(1, ...stats.byCategory.map((row) => row.count))
    : 1;

  return (
    <>
      <PageHead
        kicker="Redacția Corbul"
        title={user ? `Bun venit, ${user.name.split(" ")[0]}` : "Panou editorial"}
        description="Starea portalului la zi: producție editorială, audiență, abonamente și corespondență."
        action={
          <span
            className={
              "inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] " +
              (health?.ok
                ? "border-sage/45 bg-sage/10 text-sage"
                : "border-ember/45 bg-ember/10 text-ember")
            }
          >
            <span
              aria-hidden="true"
              className={
                "size-1.5 rounded-full " + (health?.ok ? "bg-sage" : "bg-ember")
              }
            />
            {health?.ok
              ? `API activ · ${formatNumber(health.articles, "ro")} articole`
              : "API indisponibil"}
          </span>
        }
      />

      {error ? (
        <div className="mb-6">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Carduri de statistici                                         */}
      {/* ------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-5">
        <StatCard
          label="Articole"
          value={stats ? formatNumber(stats.articles, "ro") : "—"}
          note={
            stats
              ? `${formatNumber(stats.published, "ro")} publicate · ${formatNumber(stats.premium, "ro")} premium`
              : undefined
          }
          loading={loading}
        />
        <StatCard
          label="Vizualizări"
          value={stats ? formatNumber(stats.views, "ro") : "—"}
          note="cumulat, toate articolele"
          loading={loading}
        />
        <StatCard
          label="Abonați activi"
          value={stats ? formatNumber(stats.subscribers.active, "ro") : "—"}
          note={
            stats
              ? `${formatNumber(stats.subscribers.total, "ro")} înregistrați`
              : undefined
          }
          loading={loading}
        />
        <StatCard
          label="Venit estimat"
          value={stats ? formatMoney(stats.revenueMdl, "ro", "MDL") : "—"}
          note={
            stats
              ? `${formatNumber(stats.partners.active, "ro")} parteneri activi`
              : undefined
          }
          loading={loading}
          accent
        />
        <StatCard
          label="Mesaje netratate"
          value={stats ? formatNumber(stats.messages.unread, "ro") : "—"}
          note={
            stats && stats.partners.pending > 0
              ? `${formatNumber(stats.partners.pending, "ro")} parteneriate în așteptare`
              : "contact și ponturi"
          }
          loading={loading}
          href="/admin/mesaje"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* -------------------------------------------------------- */}
        {/* Distribuția pe categorii                                  */}
        {/* -------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Producție" title="Articole pe categorii" />
          {loading && !stats ? (
            <LoadingRows rows={6} />
          ) : stats && stats.byCategory.length > 0 ? (
            <ul className="flex flex-col gap-3 px-4 py-5 sm:px-5">
              {stats.byCategory.map((row) => {
                const hue = hueOf(row.slug);
                const width = Math.max(2, Math.round((row.count / maxCount) * 100));
                return (
                  <li key={row.slug} className="grid grid-cols-[1fr_auto] gap-x-3">
                    <Link
                      href={`/admin/articole?categorie=${row.slug}`}
                      className="truncate font-sans text-[0.8125rem] text-fog transition-colors hover:text-ivory"
                    >
                      {row.name}
                    </Link>
                    <span className="tabular text-[0.8125rem] font-semibold text-ivory">
                      {formatNumber(row.count, "ro")}
                    </span>
                    <span
                      aria-hidden="true"
                      className="col-span-2 mt-1.5 block h-1 bg-coal-2"
                    >
                      <span
                        className="block h-full transition-[width] duration-500"
                        style={{
                          width: `${width}%`,
                          background: `linear-gradient(90deg, hsl(${hue} 52% 55%), hsl(${hue} 42% 38%))`,
                        }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Nicio categorie" message="Baza de date nu conține încă articole." />
          )}
        </Panel>

        {/* -------------------------------------------------------- */}
        {/* Ultimii abonați                                           */}
        {/* -------------------------------------------------------- */}
        <Panel>
          <PanelHead
            kicker="Abonamente"
            title="Ultimii abonați"
            action={
              <Link
                href="/admin/abonati"
                className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-mist transition-colors hover:text-gold"
              >
                Toți →
              </Link>
            }
          />
          {loading && !stats ? (
            <LoadingRows rows={4} />
          ) : stats && stats.latestSubscribers.length > 0 ? (
            <ul className="divide-y divide-line">
              {stats.latestSubscribers.slice(0, 6).map((subscriber) => (
                <li
                  key={subscriber.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] text-ivory">
                      {subscriber.email}
                    </p>
                    <p className="meta mt-0.5">
                      {subscriber.plan ? PLAN_LABEL[subscriber.plan] : "fără plan"} ·{" "}
                      {formatDateShort(subscriber.createdAt, "ro")}
                    </p>
                  </div>
                  <Badge tone={SUBSCRIBER_TONE[subscriber.status] ?? "neutral"}>
                    {subscriber.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Niciun abonat încă"
              message="Abonamentele Premium apar aici imediat ce Stripe confirmă prima plată."
            />
          )}
        </Panel>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Ultimele articole                                             */}
      {/* ------------------------------------------------------------ */}
      <Panel className="mt-6">
        <PanelHead
          kicker="Flux editorial"
          title="Ultimele articole"
          action={
            <Link
              href="/admin/articole"
              className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-mist transition-colors hover:text-gold"
            >
              Administrează →
            </Link>
          }
        />
        {loading && !stats ? (
          <LoadingRows rows={6} />
        ) : data && data.recent.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.recent.map((article) => (
              <li
                key={article.id}
                className={
                  "flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-coal-2/50 sm:px-5" +
                  (article.published === false ? " opacity-70" : "")
                }
              >
                <div className="min-w-0 flex-1 basis-72">
                  {/* Titlul duce la tabelul redacțional filtrat pe material —
                      niciodată la o pagină publică inexistentă (ciorne). */}
                  <Link
                    href={`/admin/articole?q=${encodeURIComponent(article.slug)}`}
                    className="line-clamp-1 font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                  >
                    {article.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <CategoryChip
                      name={article.categoryName}
                      hue={article.categoryHue}
                    />
                    <span className="meta">{article.authorName}</span>
                    {article.published === true ? (
                      <Link
                        href={`/ro/articol/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mist transition-colors hover:text-gold"
                      >
                        Vezi pe site ↗
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {article.published === false ? (
                    <Badge tone="neutral">Ciornă</Badge>
                  ) : null}
                  {article.breaking ? <Badge tone="danger">Breaking</Badge> : null}
                  {article.featured ? <Badge tone="gold">Featured</Badge> : null}
                  {article.premium ? <Badge tone="warn">Premium</Badge> : null}
                </div>
                <span className="meta w-20 text-right tabular">
                  {formatNumber(article.views, "ro")} viz.
                </span>
                <span className="meta w-24 text-right tabular">
                  {formatDateShort(article.publishedAt, "ro")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Niciun articol"
            message="Adaugă primul material din secțiunea Articole."
          />
        )}
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  note,
  loading,
  accent,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  loading?: boolean;
  accent?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-mist">
        {label}
      </p>
      {loading ? (
        <span className="mt-3 block h-7 w-20 animate-pulse bg-coal-2" />
      ) : (
        <p
          className={
            "mt-2 font-display text-2xl leading-none tabular sm:text-[1.75rem] " +
            (accent ? "text-gold" : "text-ivory")
          }
        >
          {value}
        </p>
      )}
      {note ? (
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-mist">{note}</p>
      ) : null}
    </>
  );

  const shell =
    "relative flex min-h-[7.5rem] flex-col bg-coal px-4 py-4 transition-colors duration-200 hover:bg-coal-2";

  return href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
