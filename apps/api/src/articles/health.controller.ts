/**
 * `GET /api/health` → `{ ok, name: 'corbul-api', articles }` (SPEC §4).
 * Nu aruncă niciodată: la o bază indisponibilă întoarce `ok: false`.
 */

import { Controller, Get } from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { HealthDto } from './article.types';

@Controller('health')
export class HealthController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  health(): Promise<HealthDto> {
    return this.articles.health();
  }
}
