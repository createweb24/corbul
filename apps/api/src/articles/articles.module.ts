import { Module } from '@nestjs/common';

import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { HealthController } from './health.controller';

/**
 * Conținut public: articole + `GET /api/health` (SPEC §4, A1).
 * `PrismaModule` e `@Global()`, deci nu se importă explicit.
 */
@Module({
  controllers: [ArticlesController, HealthController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
