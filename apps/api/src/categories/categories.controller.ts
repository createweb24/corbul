import { Controller, Get, Param, Query } from '@nestjs/common';

import { CategoryDto } from '../articles/article.types';
import { LocaleQuery } from '../articles/dto/query.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** `GET /api/categories?locale=` → `CategoryDto[]` */
  @Get()
  list(@Query() query: LocaleQuery): Promise<CategoryDto[]> {
    return this.categories.list(query.locale);
  }

  /** `GET /api/categories/:slug?locale=` → `CategoryDto` (404 dacă lipsește) */
  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Query() query: LocaleQuery,
  ): Promise<CategoryDto> {
    return this.categories.getBySlug(slug, query.locale);
  }
}
