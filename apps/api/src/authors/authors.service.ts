/**
 * Corbul.md — autori publici (SPEC §4, A1).
 * `articleCount` numără doar articolele publicate.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  articleListSelect,
  authorFullSelect,
  publishedOrder,
  toArticleList,
  toAuthor,
} from '../articles/article.mapper';
import {
  AuthorDto,
  AuthorWithArticlesDto,
  normalizeLocale,
} from '../articles/article.types';

/** Câte articole se întorc pe pagina de autor (SPEC nu paginează ruta). */
const AUTHOR_ARTICLES_LIMIT = 48;

const authorSelect = {
  ...authorFullSelect,
  _count: { select: { articles: { where: { published: true } } } },
} satisfies Prisma.AuthorSelect;

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(localeInput: unknown): Promise<AuthorDto[]> {
    const locale = normalizeLocale(localeInput);
    const rows = await this.prisma.author.findMany({
      orderBy: [{ name: 'asc' }],
      select: authorSelect,
    });
    return rows.map((row) => toAuthor(row, locale, row._count.articles));
  }

  async getBySlug(
    slug: string,
    localeInput: unknown,
  ): Promise<AuthorWithArticlesDto> {
    const locale = normalizeLocale(localeInput);

    const row = await this.prisma.author.findUnique({
      where: { slug },
      select: authorSelect,
    });
    if (!row) throw new NotFoundException('Autorul nu a fost găsit');

    const articles = await this.prisma.article.findMany({
      where: { published: true, author: { slug } },
      orderBy: publishedOrder,
      take: AUTHOR_ARTICLES_LIMIT,
      select: articleListSelect,
    });

    return {
      ...toAuthor(row, locale, row._count.articles),
      articles: articles.map((article) => toArticleList(article, locale)),
    };
  }
}
