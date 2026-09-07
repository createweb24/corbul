/**
 * Corbul.md — proiecțiile Prisma și maparea spre DTO-urile publice.
 *
 * Funcții pure, fără DI: `authors` și `search` le reutilizează fără să
 * importe `ArticlesModule` (evită dependențele circulare între module).
 */

import { Prisma } from '@prisma/client';

import {
  ArticleFullDto,
  ArticleListDto,
  AuthorDto,
  Locale,
  SourceRef,
  pick,
} from './article.types';
import { PAYWALL_PARAGRAPHS, truncateContent } from './paywall';

/* ------------------------------------------------------------------ */
/* Proiecții                                                           */
/* ------------------------------------------------------------------ */

export const articleAuthorSelect = {
  slug: true,
  name: true,
  initials: true,
} satisfies Prisma.AuthorSelect;

export const authorFullSelect = {
  slug: true,
  name: true,
  initials: true,
  email: true,
  roleRo: true,
  roleRu: true,
  bioRo: true,
  bioRu: true,
} satisfies Prisma.AuthorSelect;

export const articleListSelect = {
  id: true,
  slug: true,
  titleRo: true,
  titleRu: true,
  summaryRo: true,
  summaryRu: true,
  tagsRo: true,
  tagsRu: true,
  coverSeed: true,
  featured: true,
  breaking: true,
  premium: true,
  views: true,
  readMin: true,
  publishedAt: true,
  category: {
    select: { slug: true, nameRo: true, nameRu: true, hue: true },
  },
  author: { select: articleAuthorSelect },
} satisfies Prisma.ArticleSelect;

export const articleFullSelect = {
  ...articleListSelect,
  contentRo: true,
  contentRu: true,
  sources: true,
  updatedAt: true,
  author: { select: authorFullSelect },
} satisfies Prisma.ArticleSelect;

export type ArticleListRow = Prisma.ArticleGetPayload<{
  select: typeof articleListSelect;
}>;

export type ArticleFullRow = Prisma.ArticleGetPayload<{
  select: typeof articleFullSelect;
}>;

export type AuthorFullRow = Prisma.AuthorGetPayload<{
  select: typeof authorFullSelect;
}>;

/** Sortarea implicită a listelor publice: cele mai noi întâi. */
export const publishedOrder: Prisma.ArticleOrderByWithRelationInput[] = [
  { publishedAt: 'desc' },
  { id: 'desc' },
];

/* ------------------------------------------------------------------ */
/* Mapare                                                              */
/* ------------------------------------------------------------------ */

/** `sources` e `Json` în Prisma — validăm forma înainte s-o expunem. */
export function toSources(value: Prisma.JsonValue | null): SourceRef[] {
  if (!Array.isArray(value)) return [];

  const out: SourceRef[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const label = record.label;
    const url = record.url;
    if (typeof label === 'string' && typeof url === 'string' && url) {
      out.push({ label: label || url, url });
    }
  }
  return out;
}

export function toArticleList(
  row: ArticleListRow,
  locale: Locale,
): ArticleListDto {
  return {
    id: row.id,
    slug: row.slug,
    title: pick(locale, row.titleRo, row.titleRu),
    summary: pick(locale, row.summaryRo, row.summaryRu),
    categorySlug: row.category.slug,
    categoryName: pick(locale, row.category.nameRo, row.category.nameRu),
    categoryHue: row.category.hue,
    author: {
      slug: row.author.slug,
      name: row.author.name,
      initials: row.author.initials,
    },
    publishedAt: row.publishedAt.toISOString(),
    readMin: row.readMin,
    views: row.views,
    coverSeed: row.coverSeed,
    featured: row.featured,
    breaking: row.breaking,
    premium: row.premium,
    tags: pick(locale, row.tagsRo, row.tagsRu),
  };
}

export function toAuthor(
  row: AuthorFullRow,
  locale: Locale,
  articleCount?: number,
): AuthorDto {
  const dto: AuthorDto = {
    slug: row.slug,
    name: row.name,
    initials: row.initials,
    role: pick(locale, row.roleRo, row.roleRu),
    bio: pick(locale, row.bioRo, row.bioRu),
    email: row.email,
  };
  if (articleCount !== undefined) dto.articleCount = articleCount;
  return dto;
}

/**
 * Articolul complet. `hasAccess` = cititorul e abonat activ (sau articolul
 * nu e premium): la fals, conținutul se reduce la primele două paragrafe.
 */
export function toArticleFull(
  row: ArticleFullRow,
  locale: Locale,
  hasAccess: boolean,
): ArticleFullDto {
  const listRow: ArticleListRow = {
    ...row,
    author: {
      slug: row.author.slug,
      name: row.author.name,
      initials: row.author.initials,
    },
  };

  const base = toArticleList(listRow, locale);
  const fullContent = pick(locale, row.contentRo, row.contentRu);
  const locked = row.premium && !hasAccess;

  return {
    ...base,
    content: locked
      ? truncateContent(fullContent, PAYWALL_PARAGRAPHS)
      : fullContent,
    contentIsTruncated: locked,
    sources: toSources(row.sources),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    author: toAuthor(row.author, locale),
  };
}
