/**
 * Corbul.md — rutele publice de articole (SPEC §4).
 *
 * ATENȚIE la ordine: rutele literale (`most-read`) trebuie declarate ÎNAINTE
 * de `:slug`, altfel Express le înghite ca parametru.
 */

import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';

import { ArticlesService } from './articles.service';
import {
  ArticleFullDto,
  ArticleListDto,
  PaginatedDto,
  ViewCountDto,
} from './article.types';
import { LimitQuery, ListArticlesQuery, LocaleQuery } from './dto/query.dto';
import { ReaderToken } from './reader-token.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  /** `GET /api/articles?locale=&category=&page=&perPage=&featured=&breaking=` */
  @Get()
  list(
    @Query() query: ListArticlesQuery,
  ): Promise<PaginatedDto<ArticleListDto>> {
    return this.articles.list(query);
  }

  /** `GET /api/articles/most-read?locale=&limit=` — înaintea lui `:slug`. */
  @Get('most-read')
  mostRead(@Query() query: LimitQuery): Promise<ArticleListDto[]> {
    return this.articles.mostRead(query.locale, query.limit);
  }

  /** `GET /api/articles/:slug/related?locale=&limit=` */
  @Get(':slug/related')
  related(
    @Param('slug') slug: string,
    @Query() query: LimitQuery,
  ): Promise<ArticleListDto[]> {
    return this.articles.related(slug, query.locale, query.limit);
  }

  /** `GET /api/articles/:slug?locale=` — aplică paywall-ul. */
  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Query() query: LocaleQuery,
    @ReaderToken() readerToken: string | null,
  ): Promise<ArticleFullDto> {
    return this.articles.getBySlug(slug, query.locale, readerToken);
  }

  /** `POST /api/articles/:slug/view` → `{ views }` */
  @Post(':slug/view')
  @HttpCode(200)
  view(@Param('slug') slug: string): Promise<ViewCountDto> {
    return this.articles.registerView(slug);
  }
}
