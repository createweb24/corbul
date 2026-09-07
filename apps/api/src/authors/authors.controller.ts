import { Controller, Get, Param, Query } from '@nestjs/common';

import { AuthorDto, AuthorWithArticlesDto } from '../articles/article.types';
import { LocaleQuery } from '../articles/dto/query.dto';
import { AuthorsService } from './authors.service';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authors: AuthorsService) {}

  /** `GET /api/authors?locale=` → `AuthorDto[]` (cu `articleCount`) */
  @Get()
  list(@Query() query: LocaleQuery): Promise<AuthorDto[]> {
    return this.authors.list(query.locale);
  }

  /** `GET /api/authors/:slug?locale=` → `AuthorDto & { articles }` */
  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Query() query: LocaleQuery,
  ): Promise<AuthorWithArticlesDto> {
    return this.authors.getBySlug(slug, query.locale);
  }
}
