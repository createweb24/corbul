/**
 * Corbul.md — tipurile de răspuns publice (SPEC §4).
 *
 * Oglindesc LITERAL interfețele din `apps/web/src/lib/types.ts`.
 * Localizarea se face în service; web-ul primește câmpuri deja localizate.
 */

export type Locale = 'ro' | 'ru';

export const LOCALES: readonly Locale[] = ['ro', 'ru'];

export const DEFAULT_LOCALE: Locale = 'ro';

export function isLocale(value: unknown): value is Locale {
  return value === 'ro' || value === 'ru';
}

/** Orice valoare necunoscută cade pe `ro` — rutele publice nu trebuie să crape. */
export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Alege varianta lingvistică a unui câmp bilingv. */
export function pick<T>(locale: Locale, ro: T, ru: T): T {
  return locale === 'ru' ? ru : ro;
}

export interface SourceRef {
  label: string;
  url: string;
}

export interface ArticleAuthorRef {
  slug: string;
  name: string;
  initials: string;
}

export interface ArticleListDto {
  id: number;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  categoryHue: number;
  author: ArticleAuthorRef;
  publishedAt: string;
  readMin: number;
  views: number;
  coverSeed: number;
  featured: boolean;
  breaking: boolean;
  premium: boolean;
  tags: string[];
}

export interface AuthorDto {
  slug: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  email: string;
  articleCount?: number;
}

export interface ArticleFullDto extends Omit<ArticleListDto, 'author'> {
  content: string;
  /** true dacă articolul e premium și cititorul nu are abonament activ */
  contentIsTruncated: boolean;
  sources: SourceRef[];
  updatedAt: string | null;
  author: AuthorDto;
}

export interface CategoryDto {
  /** id-ul numeric, folosit de editorul din admin (`categoryId`) */
  id: number;
  slug: string;
  name: string;
  description: string;
  hue: number;
  order: number;
  count: number;
}

export interface AuthorWithArticlesDto extends AuthorDto {
  articles: ArticleListDto[];
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface SearchResultDto {
  items: ArticleListDto[];
  total: number;
  q: string;
}

export interface HealthDto {
  ok: boolean;
  name: 'corbul-api';
  articles: number;
}

export interface ViewCountDto {
  views: number;
}
