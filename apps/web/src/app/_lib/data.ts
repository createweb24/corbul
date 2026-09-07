import { cookies } from "next/headers";
import { qs, safeFetch } from "@/lib/api";
import type {
  ArticleFullDto,
  ArticleListDto,
  ArticleListResponse,
  AuthorDto,
  AuthorWithArticlesDto,
  CategoryDto,
  Locale,
  SearchResultDto,
  SettingsDto,
  WidgetsDto,
} from "@/lib/types";
import { fallbackCategories } from "./categories";

/**
 * Toate citirile de date pentru paginile publice.
 *
 * Fiecare cerere poartă o etichetă de cache (`TAGS`), pe care ruta
 * `POST /api/revalidate` o golește după o salvare din admin (contract C2).
 *
 * Regulă unică: nici o funcție de aici nu aruncă. Cu API-ul oprit paginile
 * primesc liste goale sau `null` și randează o stare goală decentă — build-ul
 * și `next dev` nu depind de disponibilitatea serverului NestJS.
 */

/** Etichetele de cache Next golite de `POST /api/revalidate`. */
export const TAGS = {
  settings: ["settings"],
  categories: ["categories", "articles"],
  articles: ["articles"],
  authors: ["authors", "articles"],
} as const;

export const REVALIDATE = {
  // setările se golesc și prin `POST /api/revalidate` (contract C2);
  // 60 s este doar plasa de siguranță dacă apelul din admin nu ajunge
  settings: 60,
  widgets: 900,
  categories: 600,
  list: 300,
  article: 300,
  authors: 900,
} as const;

/** Cookie-ul opac de cititor abonat, setat de pagina de succes a plății. */
export const READER_COOKIE = "corbul_reader";

export async function getReaderToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(READER_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Setări + widgeturi                                                  */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<SettingsDto | null> {
  return safeFetch<SettingsDto>("/settings", {
    revalidate: REVALIDATE.settings,
    tags: [...TAGS.settings],
  });
}

export async function getWidgets(): Promise<WidgetsDto | null> {
  return safeFetch<WidgetsDto>("/widgets", { revalidate: REVALIDATE.widgets });
}

/* ------------------------------------------------------------------ */
/* Categorii                                                           */
/* ------------------------------------------------------------------ */

export async function getCategories(locale: Locale): Promise<CategoryDto[]> {
  const list = await safeFetch<CategoryDto[]>(`/categories${qs({ locale })}`, {
    revalidate: REVALIDATE.categories,
    tags: [...TAGS.categories],
  });
  if (!list || list.length === 0) return fallbackCategories(locale);
  return [...list].sort((a, b) => a.order - b.order);
}

export async function getCategory(
  slug: string,
  locale: Locale,
): Promise<CategoryDto | null> {
  return safeFetch<CategoryDto>(`/categories/${slug}${qs({ locale })}`, {
    revalidate: REVALIDATE.categories,
    tags: [...TAGS.categories],
  });
}

/* ------------------------------------------------------------------ */
/* Articole                                                            */
/* ------------------------------------------------------------------ */

export interface ArticleQuery {
  locale: Locale;
  category?: string;
  page?: number;
  perPage?: number;
  featured?: boolean;
  breaking?: boolean;
}

const EMPTY_LIST: ArticleListResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 0,
  pages: 0,
};

/** Limita impusă de DTO-ul de query al API-ului (`perPage` ≤ 48). */
export const MAX_PER_PAGE = 48;

export async function getArticles(
  query: ArticleQuery,
): Promise<ArticleListResponse> {
  const perPage = query.perPage
    ? Math.min(Math.max(1, query.perPage), MAX_PER_PAGE)
    : undefined;
  const result = await safeFetch<ArticleListResponse>(
    `/articles${qs({ ...query, perPage })}`,
    { revalidate: REVALIDATE.list, tags: [...TAGS.articles] },
  );
  if (!result || !Array.isArray(result.items)) {
    return { ...EMPTY_LIST, page: query.page ?? 1, perPage: perPage ?? 12 };
  }
  return result;
}

/** Fondul de articole al primei pagini — o singură cerere, maximul permis. */
export async function getArticlePool(
  locale: Locale,
  perPage = MAX_PER_PAGE,
): Promise<ArticleListDto[]> {
  const result = await getArticles({ locale, perPage });
  return result.items;
}

/**
 * Toate articolele publicate, paginate până la epuizare — pentru sitemap.
 * Se oprește la `maxPages` ca să nu bată la infinit într-un API defect.
 */
export async function getAllArticles(
  locale: Locale,
  maxPages = 12,
): Promise<ArticleListDto[]> {
  const out: ArticleListDto[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= maxPages) {
    const result = await getArticles({ locale, page, perPage: MAX_PER_PAGE });
    if (result.items.length === 0) break;
    out.push(...result.items);
    pages = result.pages || 1;
    page += 1;
  }
  return out;
}

export async function getArticle(
  slug: string,
  locale: Locale,
  readerToken: string | null,
): Promise<ArticleFullDto | null> {
  // cererea depinde de cititor (paywall) → fără cache partajat
  return safeFetch<ArticleFullDto>(`/articles/${slug}${qs({ locale })}`, {
    readerToken,
    noStore: true,
  });
}

export async function getRelated(
  slug: string,
  locale: Locale,
  limit = 3,
): Promise<ArticleListDto[]> {
  const list = await safeFetch<ArticleListDto[]>(
    `/articles/${slug}/related${qs({ locale, limit })}`,
    { revalidate: REVALIDATE.list, tags: [...TAGS.articles] },
  );
  return Array.isArray(list) ? list : [];
}

export async function getMostRead(
  locale: Locale,
  limit = 6,
): Promise<ArticleListDto[]> {
  const list = await safeFetch<ArticleListDto[]>(
    `/articles/most-read${qs({ locale, limit })}`,
    { revalidate: REVALIDATE.list, tags: [...TAGS.articles] },
  );
  return Array.isArray(list) ? list : [];
}

/* ------------------------------------------------------------------ */
/* Autori                                                              */
/* ------------------------------------------------------------------ */

export async function getAuthors(locale: Locale): Promise<AuthorDto[]> {
  const list = await safeFetch<AuthorDto[]>(`/authors${qs({ locale })}`, {
    revalidate: REVALIDATE.authors,
    tags: [...TAGS.authors],
  });
  return Array.isArray(list) ? list : [];
}

export async function getAuthor(
  slug: string,
  locale: Locale,
): Promise<AuthorWithArticlesDto | null> {
  return safeFetch<AuthorWithArticlesDto>(`/authors/${slug}${qs({ locale })}`, {
    revalidate: REVALIDATE.authors,
    tags: [...TAGS.authors],
  });
}

/* ------------------------------------------------------------------ */
/* Căutare                                                             */
/* ------------------------------------------------------------------ */

export async function searchArticles(
  q: string,
  locale: Locale,
  page = 1,
): Promise<SearchResultDto> {
  if (!q.trim()) return { items: [], total: 0, q };
  const result = await safeFetch<SearchResultDto>(
    `/search${qs({ q, locale, page })}`,
    { revalidate: 60, tags: [...TAGS.articles] },
  );
  if (!result || !Array.isArray(result.items)) return { items: [], total: 0, q };
  return result;
}

/* ------------------------------------------------------------------ */
/* Compoziții                                                          */
/* ------------------------------------------------------------------ */

export interface SidebarData {
  widgets: WidgetsDto | null;
  mostRead: ArticleListDto[];
}

/** Datele comune barei laterale (un singur loc, ca să nu se dubleze cererile). */
export async function getSidebarData(locale: Locale): Promise<SidebarData> {
  const [widgets, mostRead] = await Promise.all([
    getWidgets(),
    getMostRead(locale, 6),
  ]);
  return { widgets, mostRead };
}
