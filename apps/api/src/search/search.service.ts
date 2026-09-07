/**
 * Corbul.md — căutare publică (SPEC §4, A1).
 * OR pe titlu/sumar/conținut în ambele limbi, `mode: 'insensitive'`.
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { escapeLike } from '../common/like';
import { PrismaService } from '../prisma/prisma.service';
import {
  articleListSelect,
  publishedOrder,
  toArticleList,
} from '../articles/article.mapper';
import { SearchResultDto, normalizeLocale } from '../articles/article.types';
import { SearchQuery, clampInt } from '../articles/dto/query.dto';

const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 48;
/** Sub 2 caractere căutarea ar întoarce aproape tot — se sare interogarea. */
const MIN_QUERY_LENGTH = 2;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQuery): Promise<SearchResultDto> {
    const locale = normalizeLocale(query.locale);
    const q = (query.q ?? '').trim();

    if (q.length < MIN_QUERY_LENGTH) {
      return { items: [], total: 0, q };
    }

    const page = clampInt(query.page, 1, 1, 10_000);
    const perPage = clampInt(query.perPage, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);

    // „50%” sau „___” trebuie căutate literal, nu ca metacaractere LIKE.
    const contains: Prisma.StringFilter = {
      contains: escapeLike(q),
      mode: 'insensitive',
    };

    const where: Prisma.ArticleWhereInput = {
      published: true,
      OR: [
        { titleRo: contains },
        { titleRu: contains },
        { summaryRo: contains },
        { summaryRu: contains },
        { contentRo: contains },
        { contentRu: contains },
      ],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy: publishedOrder,
        skip: (page - 1) * perPage,
        take: perPage,
        select: articleListSelect,
      }),
    ]);

    return {
      items: rows.map((row) => toArticleList(row, locale)),
      total,
      q,
    };
  }
}
