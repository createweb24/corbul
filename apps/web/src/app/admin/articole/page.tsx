"use client";

/**
 * `/admin/articole` — tabelul redacțional (SPEC §9).
 * Căutare, filtru pe categorie, comutatoare inline care fac PATCH pe ruta de
 * marcaje, paginare, editor în modal și ștergere confirmată tot prin modal.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateShort, formatNumber } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import type {
  AdminArticleDto,
  AdminArticleListResponse,
  AdminAuthorDto,
} from "@/lib/types";
import { ArticleEditor } from "../_components/ArticleEditor";
import { ConfirmDialog } from "../_components/Modal";
import { useToast } from "../_components/toast";
import {
  Button,
  CategoryChip,
  EmptyState,
  ErrorNote,
  LoadingRows,
  PageHead,
  Pager,
  Panel,
  Select,
  TextInput,
} from "../_components/ui";
import {
  loadAuthors,
  loadCategories,
  invalidateCategories,
  type AdminCategory,
} from "../_lib/catalog";
import { adminFetch, errorMessage, revalidateSite } from "../_lib/session";
import { qs } from "@/lib/api";

const PER_PAGE = 20;

type Flag = "featured" | "breaking" | "premium" | "published";

const FLAGS: { key: Flag; glyph: string; label: string }[] = [
  { key: "published", glyph: "●", label: "Publicat" },
  { key: "featured", glyph: "★", label: "Featured" },
  { key: "breaking", glyph: "⚡", label: "Breaking" },
  { key: "premium", glyph: "◆", label: "Premium" },
];

/**
 * Coloanele tabelului. Lățimile fixe (`table-fixed`) țin coloanele scurte la
 * dimensiunea lor naturală, iar titlul primește tot restul. Suma coloanelor
 * fixe este 50,5 rem; cu `min-w-[64rem]` titlul are garantat ≥ 13,5 rem, iar
 * de la 1440 px viewport (container ≈ 1100 px) tabelul încape fără derulare.
 */
const COLUMNS: {
  label: string;
  width?: string;
  align?: "right";
  sticky?: boolean;
}[] = [
  { label: "Titlu" },
  { label: "Categorie", width: "w-36" },
  { label: "Autor", width: "w-32" },
  { label: "Publicat", width: "w-24", align: "right" },
  { label: "Vizual.", width: "w-20", align: "right" },
  { label: "Marcaje", width: "w-36", align: "right" },
  { label: "Acțiuni", width: "w-[13.5rem]", align: "right", sticky: true },
];

/**
 * Celula lipită de marginea dreaptă când tabelul se derulează orizontal.
 * Fundalul trebuie să fie opac (rândul de sub ea ar transpărea), iar la hover
 * reproduce exact nuanța rândului (`coal-2` la 50 % peste `coal`).
 */
const STICKY_CELL =
  "sticky right-0 z-[1] border-l border-line bg-coal group-hover:bg-[color-mix(in_srgb,var(--color-coal-2)_50%,var(--color-coal))]";

export default function ArticolePage() {
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<AdminArticleListResponse | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [authors, setAuthors] = useState<AdminAuthorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<number | null>(null);

  /** `undefined` = editor închis · `null` = articol nou · obiect = editare */
  const [editing, setEditing] = useState<AdminArticleDto | null | undefined>(
    undefined,
  );
  const [pendingDelete, setPendingDelete] = useState<AdminArticleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Filtrele preluate din link-urile panoului (`?categorie=slug`, `?q=`). */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("categorie");
    if (slug) setCategorySlug(slug);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  /* Catalogul: categorii (cu id dedus) + autori. */
  useEffect(() => {
    let alive = true;
    Promise.all([loadCategories(), loadAuthors()])
      .then(([loadedCategories, loadedAuthors]) => {
        if (!alive) return;
        setCategories(loadedCategories);
        setAuthors(loadedAuthors);
      })
      .catch(() => {
        /* eroarea listei principale acoperă și acest caz */
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Căutare temperată. */
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced, categorySlug]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<AdminArticleListResponse>(
        `/admin/articles${qs({
          q: debounced || undefined,
          category: categorySlug || undefined,
          page,
          perPage: PER_PAGE,
        })}`,
      );
      // Pagina a rămas goală (ex. ultimul articol de pe ea a fost șters):
      // sărim pe ultima pagină reală în loc să arătăm starea „bază goală”.
      if (result.items.length === 0 && result.total > 0 && page > result.pages) {
        setPage(Math.max(1, result.pages));
        return;
      }
      setData(result);
    } catch (caught) {
      setError(errorMessage(caught, "Lista de articole nu a putut fi încărcată."));
    } finally {
      setLoading(false);
    }
  }, [debounced, categorySlug, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = data?.items ?? [];

  const categoryLookup = useMemo(() => {
    const map = new Map<string, AdminCategory>();
    for (const category of categories) map.set(category.slug, category);
    return map;
  }, [categories]);

  /* ---------------------------------------------------------------- */
  /* Marcaje inline                                                    */
  /* ---------------------------------------------------------------- */

  async function toggleFlag(article: AdminArticleDto, flag: Flag) {
    const next = !article[flag];
    setBusyRow(article.id);
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === article.id ? { ...item, [flag]: next } : item,
            ),
          }
        : current,
    );
    try {
      const saved = await adminFetch<AdminArticleDto>(
        `/admin/articles/${article.id}/flags`,
        { method: "PATCH", body: { [flag]: next } },
      );
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === saved.id ? saved : item,
              ),
            }
          : current,
      );
      void revalidateSite();
    } catch (caught) {
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === article.id ? article : item,
              ),
            }
          : current,
      );
      toast.error("Marcajul nu a fost salvat.", errorMessage(caught));
    } finally {
      setBusyRow(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Ștergere                                                          */
  /* ---------------------------------------------------------------- */

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/articles/${pendingDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Articol șters.", pendingDelete.titleRo);
      setPendingDelete(null);
      invalidateCategories();
      void revalidateSite();
      await load();
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  function onSaved(saved: AdminArticleDto, created: boolean) {
    setEditing(undefined);
    if (created) invalidateCategories();
    setData((current) =>
      current && !created
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === saved.id ? saved : item,
            ),
          }
        : current,
    );
    if (created) {
      setPage(1);
      void load();
    }
  }

  /* ---------------------------------------------------------------- */

  return (
    <>
      <PageHead
        kicker="Producție editorială"
        title="Articole"
        description="Toate materialele din baza de date, în forma lor brută — română și rusă, marcaje, surse și coperți."
        action={
          <Button variant="gold" onClick={() => setEditing(null)}>
            + Articol nou
          </Button>
        }
      />

      {/* Filtre */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după titlu, sumar sau slug…"
            aria-label="Caută articole"
            className="pl-9"
          />
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist"
          >
            <circle
              cx="9"
              cy="9"
              r="5.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="m13 13 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="w-56">
          <Select
            value={categorySlug}
            aria-label="Filtrează după categorie"
            onChange={(event) => setCategorySlug(event.target.value)}
          >
            <option value="">Toate categoriile</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name} ({category.count})
              </option>
            ))}
          </Select>
        </div>
        {debounced || categorySlug ? (
          <Button
            variant="quiet"
            onClick={() => {
              setQuery("");
              setCategorySlug("");
            }}
          >
            Golește filtrele
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <Panel>
        {loading && !data ? (
          <LoadingRows rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Niciun articol găsit"
            message={
              debounced || categorySlug
                ? "Încearcă alți termeni sau golește filtrele."
                : "Adaugă primul material al redacției."
            }
            action={
              <Button variant="gold" onClick={() => setEditing(null)}>
                + Articol nou
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            {/* Layout fix: coloanele cu conținut scurt au lățimi stabilite,
                titlul preia restul (pe două rânduri, apoi „…”). Astfel tabelul
                încape în container de la 1440 px în sus; sub această lățime
                se derulează orizontal, dar coloana de acțiuni rămâne lipită de
                marginea dreaptă, ca „Șterge” să fie mereu la vedere. */}
            <table className="w-full min-w-[64rem] table-fixed border-collapse text-left">
              <colgroup>
                {COLUMNS.map((column) => (
                  <col key={column.label} className={column.width} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-line-2">
                  {COLUMNS.map((column) => (
                    <th
                      key={column.label}
                      scope="col"
                      className={cn(
                        "px-2.5 py-2.5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-mist",
                        column.align === "right" && "text-right",
                        column.sticky && STICKY_CELL,
                      )}
                    >
                      {/* vizual coloana de acțiuni rămâne fără titlu, dar
                          cititoarele de ecran primesc un antet real */}
                      {column.sticky ? (
                        <span className="sr-only">{column.label}</span>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((article) => {
                  const category = categoryLookup.get(
                    article.category?.slug ?? "",
                  );
                  return (
                    <tr
                      key={article.id}
                      className={cn(
                        "group align-top transition-colors duration-200 hover:bg-coal-2/50",
                        !article.published && "opacity-65",
                      )}
                    >
                      <td className="px-2.5 py-3">
                        <button
                          type="button"
                          onClick={() => setEditing(article)}
                          title={article.titleRo}
                          className="clamp-2 w-full text-left font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                        >
                          {article.titleRo}
                        </button>
                        <p
                          className="mt-1 truncate font-mono text-[0.6875rem] text-mist"
                          title={`/${article.slug}`}
                        >
                          /{article.slug}
                        </p>
                      </td>
                      <td className="px-2.5 py-3">
                        <CategoryChip
                          name={
                            category?.name ??
                            article.category?.nameRo ??
                            "—"
                          }
                          hue={category?.hue ?? article.category?.hue ?? 42}
                        />
                      </td>
                      <td
                        className="truncate px-2.5 py-3 text-[0.8125rem] text-fog"
                        title={article.author?.name ?? undefined}
                      >
                        {article.author?.name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-right text-[0.8125rem] tabular text-fog">
                        {formatDateShort(article.publishedAt, "ro")}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-right text-[0.8125rem] tabular text-fog">
                        {formatNumber(article.views, "ro")}
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {FLAGS.map((flag) => (
                            <FlagToggle
                              key={flag.key}
                              on={article[flag.key]}
                              glyph={flag.glyph}
                              label={flag.label}
                              title={article.titleRo}
                              disabled={busyRow === article.id}
                              onToggle={() => void toggleFlag(article, flag.key)}
                            />
                          ))}
                        </div>
                      </td>
                      <td className={cn("px-2.5 py-3", STICKY_CELL)}>
                        <div className="flex items-center justify-end gap-1">
                          {article.published ? (
                            <Link
                              href={`/ro/articol/${article.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Deschide pe site"
                              aria-label={`Deschide pe site: ${article.titleRo}`}
                              className="press flex size-8 items-center justify-center border border-transparent text-mist transition-colors hover:border-line-2 hover:text-gold"
                            >
                              <ExternalIcon />
                            </Link>
                          ) : (
                            <span
                              title="Publică articolul ca să-l vezi pe site"
                              aria-label="Nepublicat — nu apare pe site"
                              className="flex size-8 cursor-default items-center justify-center text-mist/50"
                            >
                              <ExternalIcon />
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing(article)}
                          >
                            Editează
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            className="px-2.5 text-mist hover:text-ember"
                            onClick={() => setPendingDelete(article)}
                            aria-label={`Șterge „${article.titleRo}"`}
                          >
                            Șterge
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data ? (
          <div className="border-t border-line">
            <Pager
              page={data.page}
              pages={data.pages}
              total={data.total}
              onPage={setPage}
            />
          </div>
        ) : null}
      </Panel>

      {loading && data ? (
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-mist">
          Se actualizează…
        </p>
      ) : null}

      {/* Editor */}
      {editing !== undefined ? (
        <ArticleEditor
          key={editing?.id ?? "nou"}
          article={editing}
          categories={categories}
          authors={authors}
          onClose={() => setEditing(undefined)}
          onSaved={onSaved}
        />
      ) : null}

      {/* Confirmarea ștergerii — niciodată `confirm()` */}
      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi articolul?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.titleRo}</strong> va fi
            eliminat definitiv din baza de date, împreună cu ambele traduceri și
            cu vizualizările acumulate.
          </>
        }
        confirmLabel="Șterge definitiv"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
      <path
        d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V9.5M9.5 2H14v4.5M14 2 7.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagToggle({
  on,
  glyph,
  label,
  title,
  disabled,
  onToggle,
}: {
  on: boolean;
  glyph: string;
  label: string;
  title: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      title={`${label} — ${title}`}
      aria-label={`${label}: ${on ? "activ" : "inactiv"}`}
      className={cn(
        "press flex size-7 items-center justify-center border text-[0.75rem] leading-none transition-colors duration-200 disabled:opacity-40",
        on
          ? "border-gold/60 bg-gold/12 text-gold"
          : "border-line text-mist hover:border-line-2 hover:text-fog",
      )}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
