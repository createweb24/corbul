import { Controller, Get, Query } from '@nestjs/common';

import { SearchResultDto } from '../articles/article.types';
import { SearchQuery } from '../articles/dto/query.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /** `GET /api/search?q=&locale=&page=` → `{ items, total, q }` */
  @Get()
  find(@Query() query: SearchQuery): Promise<SearchResultDto> {
    return this.search.search(query);
  }
}
