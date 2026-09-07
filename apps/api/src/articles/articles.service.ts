/**
 * Corbul.md — serviciul de conținut public (SPEC §4, secțiunea A1).
 *
 * Reguli transversale:
 *  • rutele publice filtrează întotdeauna `published: true`;
 *  • sortarea implicită e descrescătoare după `publishedAt`;
 *  • localizarea se face aici, web-ul primește câmpuri deja localizate;
 *  • articolele `premium` se trunchiază la două paragrafe pentru cititorii
 *    fără abonament activ.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  articleFullSelect,
  articleListSelect,
  publishedOrder,
  toArticleFull,
  toArticleList,
} from './article.mapper';
import {
  ArticleFullDto,
  ArticleListDto,
  HealthDto,
  Locale,
  PaginatedDto,
  ViewCountDto,
  normalizeLocale,
} from './article.types';
import { ListArticlesQuery, clampInt } from './dto/query.dto';

const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 48;
const DEFAULT_RELATED = 3;
const DEFAULT_MOST_READ = 6;
const MAX_LIMIT = 24;

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------------------------------------------- */
  /* Health                                                            */
  /* ---------------------------------------------------------------- */

  async health(): Promise<HealthDto> {
    try {
      const articles = await this.prisma.article.count();
      return { ok: true, name: 'corbul-api', articles };
    } catch (error) {
      this.logger.error(
        `Health check eșuat: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { ok: false, name: 'corbul-api', articles: 0 };
    }
  }

  /* ---------------------------------------------------------------- */
  /* Liste                                                             */
  /* ---------------------------------------------------------------- */

  async list(query: ListArticlesQuery): Promise<PaginatedDto<ArticleListDto>> {
    const locale = normalizeLocale(query.locale);
    const page = clampInt(query.page, 1, 1, 10_000);
    const perPage = clampInt(query.perPage, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);

    const where: Prisma.ArticleWhereInput = { published: true };
    if (query.category) where.category = { slug: query.category };
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.breaking !== undefined) where.breaking = query.breaking;

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
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  /** Top după numărul de vizualizări (SPEC: „most-read"). */
  async mostRead(
    localeInput: unknown,
    limitInput?: number,
  ): Promise<ArticleListDto[]> {
    const locale = normalizeLocale(localeInput);
    const take = clampInt(limitInput, DEFAULT_MOST_READ, 1, MAX_LIMIT);

    const rows = await this.prisma.article.findMany({
      where: { published: true },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take,
      select: articleListSelect,
    });

    return rows.map((row) => toArticleList(row, locale));
  }

  /**
   * Aceeași categorie mai întâi; dacă nu se adună `take` articole (categoriile
   * mici au 2–3 articole), se completează cu cele mai recente din restul
   * site-ului, ca secțiunea „Articole conexe" să fie mereu plină (SPEC §7).
   */
  async related(
    slug: string,
    localeInput: unknown,
    limitInput?: number,
  ): Promise<ArticleListDto[]> {
    const locale = normalizeLocale(localeInput);
    const take = clampInt(limitInput, DEFAULT_RELATED, 1, MAX_LIMIT);

    // Doar articole publicate: un draft nu trebuie să fie detectabil public.
    const current = await this.prisma.article.findFirst({
      where: { slug, published: true },
      select: { id: true, categoryId: true },
    });
    if (!current) throw new NotFoundException('Articolul nu a fost găsit');

    const rows = await this.prisma.article.findMany({
      where: {
        published: true,
        categoryId: current.categoryId,
        id: { not: current.id },
      },
      orderBy: publishedOrder,
      take,
      select: articleListSelect,
    });

    if (rows.length < take) {
      const excluded = [current.id, ...rows.map((row) => row.id)];
      const filler = await this.prisma.article.findMany({
        where: { published: true, id: { notIn: excluded } },
        orderBy: publishedOrder,
        take: take - rows.length,
        select: articleListSelect,
      });
      rows.push(...filler);
    }

    return rows.map((row) => toArticleList(row, locale));
  }

  /* ---------------------------------------------------------------- */
  /* Articol                                                           */
  /* ---------------------------------------------------------------- */

  async getBySlug(
    slug: string,
    localeInput: unknown,
    readerToken: string | null,
  ): Promise<ArticleFullDto> {
    const locale: Locale = normalizeLocale(localeInput);

    const row = await this.prisma.article.findUnique({
      where: { slug },
      select: { ...articleFullSelect, published: true },
    });
    if (!row || !row.published) {
      throw new NotFoundException('Articolul nu a fost găsit');
    }

    const hasAccess = row.premium ? await this.hasReaderAccess(readerToken) : true;
    return toArticleFull(row, locale, hasAccess);
  }

  /**
   * Incrementează contorul de vizualizări — doar pentru articole publicate,
   * ca un draft să nu poată fi „umflat" înainte de publicare.
   */
  async registerView(slug: string): Promise<ViewCountDto> {
    const result = await this.prisma.article.updateMany({
      where: { slug, published: true },
      data: { views: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new NotFoundException('Articolul nu a fost găsit');
    }
    const row = await this.prisma.article.findUnique({
      where: { slug },
      select: { views: true },
    });
    return { views: row?.views ?? 0 };
  }

  /* ---------------------------------------------------------------- */
  /* Paywall                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Token opac valid = `Subscriber` cu `status: 'active'` și abonament
   * neexpirat (SPEC §4) — aceeași regulă ca `POST /api/subscribers/verify`,
   * altfel un webhook ratat ar lăsa accesul premium deschis la nesfârșit.
   */
  async hasReaderAccess(token: string | null): Promise<boolean> {
    if (!token) return false;
    try {
      const subscriber = await this.prisma.subscriber.findUnique({
        where: { accessToken: token },
        select: { status: true, currentPeriodEnd: true },
      });
      if (!subscriber || subscriber.status !== 'active') return false;
      return (
        subscriber.currentPeriodEnd === null ||
        subscriber.currentPeriodEnd.getTime() > Date.now()
      );
    } catch (error) {
      this.logger.warn(
        `Verificarea abonatului a eșuat: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
